-- 떡볶여지도 로컬 DB (도커, 11-08) — 지금 앱 데이터(web/src/lib/data/db.ts)를 그대로 담는 표.
-- 도커 컨테이너가 처음 뜰 때 이 파일이 자동으로 돈다 (docker-entrypoint-initdb.d). 다시 만들려면 npm run db:reset.
-- 이름은 앱 값의 이름을 snake_case 로 옮긴 것 (lastConfirmedAt → last_confirmed_at). 앱 쪽 연결: web/src/lib/data/pg.ts
-- 로그인이 없어서 「누가」는 기기 표시·접속 위치의 해시(device · ip)로만 남긴다. 화면에는 내보내지 않는다.
-- 나중에 Supabase 로 옮길 때도 이 표를 그대로 쓰고, 읽기 권한(RLS)만 더한다.

-- ───────── 가게 ─────────
create table stores (
  id text primary key,                 -- 주소에 쓰는 짧은 이름 (/store/[id])
  name text not null,
  grade text not null,                 -- specialist · bunsik · menu
  lat double precision not null,
  lng double precision not null,
  address text not null,
  gu text not null,
  dong text not null,
  rice jsonb not null default '[]',    -- 떡 종류
  style text not null,
  spice smallint not null check (spice between 1 and 5),  -- 대표 메뉴 맵기
  spice_label text,
  taste jsonb not null default '[]',
  sides jsonb not null default '[]',
  shop_type text,
  usage jsonb not null default '[]',
  price integer not null,              -- 대표 떡볶이 1인분
  price_checked_at date not null,
  menu jsonb not null default '[]',    -- [{name, price}]
  hours jsonb,                         -- {days, open, close}
  last_confirmed_at date not null,
  rating jsonb,                        -- {avg, count}
  is_sample boolean,                   -- 예시 데이터
  status text,                         -- 없으면 active · hidden · closed
  created_at date,                     -- 이용자가 등록한 가게 → 일주일 「확인 중」
  "by" text,                           -- 처음 등록한 사람 닉네임
  verify jsonb,                        -- {yes, no}
  spice_votes jsonb,
  photos jsonb,                        -- 사진 id 목록 (사진 파일은 web/.data/photos)
  memo text,                           -- 소개글
  intro_by text,
  intro_at date
);

-- 변경 이력 (새 가게 · 고침 · 아직 있어요 · 내림 · 확인 끝)
create table store_logs (
  id text primary key,
  store_id text not null references stores(id) on delete cascade,
  at timestamptz not null,
  who text not null,
  kind text not null,
  changes jsonb,
  device text not null,
  ip text not null
);
create index store_logs_store_idx on store_logs (store_id, at desc);

-- 평가 (별 + 한 줄 후기). 기기마다 가게 하나에 하나
create table reviews (
  id text primary key,
  store_id text not null references stores(id) on delete cascade,
  at timestamptz not null,
  who text not null,
  stars smallint,
  spice smallint,                      -- 예전 맵기 표 (새 평가에는 없음)
  text text,
  hidden boolean,
  flags jsonb,                         -- 신고한 기기들
  device text not null,
  ip text not null
);
create index reviews_store_idx on reviews (store_id, at desc);

-- 새 가게 「맞아요 · 달라요」
create table store_votes (
  store_id text not null references stores(id) on delete cascade,
  ok boolean not null,
  at timestamptz not null,
  device text not null,
  ip text not null,
  primary key (store_id, device, ip, at)
);

-- 가게 신고 (3명이면 내림)
create table store_flags (
  store_id text not null references stores(id) on delete cascade,
  reason text not null,
  at timestamptz not null,
  device text not null,
  ip text not null,
  primary key (store_id, device, ip, at)
);

-- ───────── 떡볶이방 (게시판) ─────────
create table posts (
  id text primary key,
  at timestamptz not null,
  who text not null,
  cat text not null,                   -- free · recommend · together
  title text not null,
  body text not null,
  store_id text references stores(id) on delete set null,
  comments integer not null default 0,
  likes integer not null default 0,
  is_sample boolean,
  hidden boolean,
  flags jsonb,
  device text not null,
  ip text not null
);
create index posts_at_idx on posts (at desc);

create table post_comments (
  id text primary key,
  post_id text not null references posts(id) on delete cascade,
  at timestamptz not null,
  who text not null,
  text text not null,
  hidden boolean,
  flags jsonb,
  device text not null,
  ip text not null
);
create index post_comments_post_idx on post_comments (post_id, at);

-- 글 추천 (기기당 한 번)
create table post_likes (
  post_id text not null references posts(id) on delete cascade,
  at timestamptz not null,
  device text not null,
  ip text not null,
  primary key (post_id, device)
);

-- ───────── 맛집 리스트 (내 맛지도) ─────────
create table place_lists (
  id text primary key,
  title text not null,
  "desc" text,
  store_ids jsonb not null default '[]',  -- 순서가 곧 리스트 순서
  who text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  visibility text not null,             -- public · link
  likes integer not null default 0,
  is_sample boolean,
  device text not null,                 -- 만든 기기 (고치기는 이 기기만)
  ip text not null
);
create index place_lists_public_idx on place_lists (visibility, likes desc);

-- 리스트 추천 (기기당 한 번)
create table list_likes (
  list_id text not null references place_lists(id) on delete cascade,
  at timestamptz not null,
  device text not null,
  ip text not null,
  primary key (list_id, device)
);
