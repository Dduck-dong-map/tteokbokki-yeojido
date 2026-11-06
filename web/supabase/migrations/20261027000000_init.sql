-- 떡볶여지도 첫 DB 설계 (M2 에서 Supabase 프로젝트를 만든 뒤 적용한다. 아직 적용 안 함)
-- 기준: 기획안 v4 5·7절, web/src/lib/taxonomy.ts (태그 키는 거기와 똑같이 맞춘다)
--
-- 원칙
-- * 누구나(로그인 없이) 가게를 읽는다 → anon 에게 읽기만 연다.
-- * 제보·'아직 있어요'·투표 쓰기는 웹 서버(route handler)가 서버 전용 키로 넣는다.
--   → 하루 10건 제한·근처 확인을 서버에서 검사할 수 있고, anon 에게 쓰기 권한을 주지 않는다.
-- * 2026-10-30 부터 Supabase 새 규칙: Data API 로 읽으려면 표마다 GRANT 를 직접 줘야 한다.
--   그래서 아래에 grant 를 빠짐없이 적는다.

create extension if not exists postgis with schema extensions;

-- ───────── 태그 보기 (taxonomy.ts 와 같은 키) ─────────
create type store_grade as enum ('specialist', 'bunsik', 'menu');
create type store_status as enum ('active', 'closed', 'hidden');
create type report_kind as enum ('new', 'edit', 'closed');
create type report_status as enum ('pending', 'approved', 'rejected');

create or replace function tteok_valid_rice(v text[]) returns boolean language sql immutable as
$$ select v <@ array['wheat','rice','noodle','garae','mini','cheese','bunmoja'] $$;
create or replace function tteok_valid_style(v text) returns boolean language sql immutable as
$$ select v = any (array['soup','classic','instant','oil','rose','jjajang','mala','royal']) $$;
create or replace function tteok_valid_taste(v text[]) returns boolean language sql immutable as
$$ select v <@ array['sweet','salty','sweetsalty','eomuk','pepper'] and cardinality(v) <= 2 $$;
create or replace function tteok_valid_sides(v text[]) returns boolean language sql immutable as
$$ select v <@ array['sundae','twigim','eomuk','gimbap','rabokki'] $$;
create or replace function tteok_valid_usage(v text[]) returns boolean language sql immutable as
$$ select v <@ array['solo','takeout','delivery','parking','cashonly'] $$;

-- ───────── 가게 ─────────
create table stores (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,                       -- /store/[slug]
  name             text not null check (char_length(name) between 1 and 60),
  grade            store_grade not null,
  status           store_status not null default 'active',
  location         extensions.geography(point, 4326) not null,
  address          text not null,
  gu               text not null,                              -- mapo, seodaemun …
  dong             text not null,
  rice             text[] not null default '{}' check (tteok_valid_rice(rice)),
  style            text not null check (tteok_valid_style(style)),
  spice            smallint not null check (spice between 1 and 5),  -- 투표 평균(반올림), 신라면 = 3
  spice_label      text,                                       -- 가게가 부르는 단계 이름
  taste            text[] not null default '{}' check (tteok_valid_taste(taste)),
  sides            text[] not null default '{}' check (tteok_valid_sides(sides)),
  shop_type        text not null check (shop_type in ('school','market','pojang','franchise','cafe')),
  usage            text[] not null default '{}' check (tteok_valid_usage(usage)),
  price            integer check (price between 500 and 50000), -- 대표 떡볶이 1인분
  price_checked_at date,
  hours            jsonb,                                      -- {"days":[1,2,3,4,5,6],"open":"10:30","close":"20:30"}
  last_confirmed_at date not null default current_date,        -- '아직 있어요'·제보 승인 때 새로 고침
  source           text not null default 'crew',               -- crew(직접 확인) · report(제보) · public(공공데이터 후보)
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index stores_location_gix on stores using gist (location);
create index stores_gu_idx on stores (gu) where status = 'active';

create table menu_items (
  id        bigint generated always as identity primary key,
  store_id  uuid not null references stores (id) on delete cascade,
  name      text not null,
  price     integer not null check (price between 0 and 200000),
  sort      smallint not null default 0
);
create index menu_items_store_idx on menu_items (store_id, sort);

-- 화면에서 읽는 모양: 위도·경도 숫자와 신선도를 붙인다
-- 180일 넘으면 stale(흐린 도장), 365일 넘으면 목록·지도에서 내린다(뷰에서 뺀다)
create view stores_public with (security_invoker = true) as
select s.slug as id, s.name, s.grade, extensions.st_y(s.location::extensions.geometry) as lat,
       extensions.st_x(s.location::extensions.geometry) as lng, s.address, s.gu, s.dong,
       s.rice, s.style, s.spice, s.spice_label, s.taste, s.sides, s.shop_type, s.usage,
       s.price, s.price_checked_at, s.hours, s.last_confirmed_at,
       (current_date - s.last_confirmed_at) > 180 as stale
from stores s
where s.status = 'active' and (current_date - s.last_confirmed_at) <= 365;

-- 지도에 보이는 네모 칸 안의 가게 (지도를 움직일 때마다 부른다)
create or replace function stores_in_bounds(min_lng double precision, min_lat double precision,
                                            max_lng double precision, max_lat double precision)
returns setof stores_public language sql stable security invoker as $$
  select p.* from stores_public p
  join stores s on s.slug = p.id
  where s.location operator(extensions.&&) extensions.st_makeenvelope(min_lng, min_lat, max_lng, max_lat, 4326)::extensions.geography
  limit 500
$$;

-- ───────── 제보 ─────────
-- 새 가게·폐업: 운영자 승인 후 반영 / 가격·맵기 수정: 다른 기기 2곳이 동의하면 반영
create table reports (
  id          bigint generated always as identity primary key,
  kind        report_kind not null,
  store_id    uuid references stores (id) on delete set null,
  payload     jsonb not null,             -- {name,address,rice,style,spice,price} — 서버가 taxonomy 로 검사한 값
  status      report_status not null default 'pending',
  device_hash text not null,              -- 기기 표시를 해시로만 (개인 정보 아님)
  ip_hash     text not null,
  created_at  timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users (id)
);
create index reports_pending_idx on reports (created_at) where status = 'pending';
create index reports_rate_idx on reports (device_hash, created_at);
create index reports_ip_rate_idx on reports (ip_hash, created_at);

create table report_agreements (
  report_id   bigint not null references reports (id) on delete cascade,
  device_hash text not null,
  created_at  timestamptz not null default now(),
  primary key (report_id, device_hash)
);

-- '아직 있어요' (가게 근처에서만, 서버가 거리 확인 후 넣음)
create table confirmations (
  id          bigint generated always as identity primary key,
  store_id    uuid not null references stores (id) on delete cascade,
  device_hash text not null,
  created_at  timestamptz not null default now()
);
create index confirmations_store_idx on confirmations (store_id, created_at desc);

-- 맵기 투표 (2차 '맛 투표' 대비, 지금은 제보 때 함께 받는다)
create table spice_votes (
  store_id    uuid not null references stores (id) on delete cascade,
  device_hash text not null,
  spice       smallint not null check (spice between 1 and 5),
  created_at  timestamptz not null default now(),
  primary key (store_id, device_hash)
);

-- ───────── 권한 ─────────
alter table stores enable row level security;
alter table menu_items enable row level security;
alter table reports enable row level security;
alter table report_agreements enable row level security;
alter table confirmations enable row level security;
alter table spice_votes enable row level security;

create policy "누구나 운영 중인 가게를 읽는다" on stores for select to anon, authenticated using (status = 'active');
create policy "누구나 메뉴를 읽는다" on menu_items for select to anon, authenticated
  using (exists (select 1 from stores s where s.id = store_id and s.status = 'active'));
-- reports·agreements·confirmations·spice_votes 에는 anon 정책이 없다 = anon 은 읽기·쓰기 모두 못 함.
-- 서버(service_role)는 RLS 를 건너뛴다.

grant usage on schema public to anon, authenticated, service_role;
grant select on stores, menu_items, stores_public to anon, authenticated;
grant execute on function stores_in_bounds(double precision, double precision, double precision, double precision) to anon, authenticated;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
