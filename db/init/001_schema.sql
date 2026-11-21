-- 떡볶여지도 DB 표 (11-08) — 앱 데이터(src/lib/data/db.ts)를 그대로 담는다.
-- 새 DB(Neon SQL Editor · CI 의 Postgres)에 001 → 004 를 차례로 돌린다. 로컬 도커 DB 는 11-19 에 지웠다.
-- 표를 바꾸는 방법은 db/README.md 「표가 바뀌면」.
-- 이름은 앱 값의 이름을 snake_case 로 옮긴 것 (lastConfirmedAt → last_confirmed_at). 앱 쪽 연결: src/lib/data/pg.ts
-- 로그인이 없어서 「누가」는 기기 표시·접속 위치의 해시(device · ip)로만 남긴다. 화면에는 내보내지 않는다.

-- ───────── 가게 ─────────
create table stores (
  id text primary key,                 -- 주소에 쓰는 짧은 이름 (/store/[id])
  name text not null,
  grade text not null check (grade in ('specialist', 'bunsik', 'menu')),
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
  status text check (status in ('active', 'hidden', 'closed')),  -- 없으면 active
  created_at date,                     -- 이용자가 등록한 가게 → 일주일 「확인 중」
  "by" text,                           -- 처음 등록한 사람 닉네임
  verify jsonb,                        -- {yes, no}
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
  kind text not null check (kind in ('new', 'edit', 'still', 'hidden', 'closed', 'verified')),
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
  primary key (store_id, device, ip)   -- 한 사람(기기 + 접속 위치)은 가게마다 한 번 (11-19: 열쇠에서 at 을 뺐다)
);

-- 가게 신고 (3명이면 내림)
create table store_flags (
  store_id text not null references stores(id) on delete cascade,
  reason text not null,
  at timestamptz not null,
  device text not null,
  ip text not null,
  primary key (store_id, device, ip)   -- 한 사람(기기 + 접속 위치)은 가게마다 한 번 (11-19: 열쇠에서 at 을 뺐다)
);

-- ───────── 떡볶이방 (게시판) ─────────
create table posts (
  id text primary key,
  at timestamptz not null,
  who text not null,
  cat text not null check (cat in ('free', 'recommend', 'together')),
  title text not null,
  body text not null,
  store_id text references stores(id) on delete set null,
  photos jsonb,                        -- 글 사진 id 목록 (11-21 · 이미 있는 DB 는 db/migrations/2026-11-21_post_photos.sql)
  comments integer not null default 0,
  likes integer not null default 0,
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
  visibility text not null check (visibility in ('public', 'link')),
  likes integer not null default 0,
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

-- ───────── 사진 하루 한도 (11-18) ─────────
-- 사진 한 장을 올릴 때마다 한 줄. 한 사람(기기 + 접속 위치) 하루 30장 · 같은 접속 위치 전체 상한을 센다 (규칙은 src/lib/data/db.ts takePhotoSlot · 숫자는 src/lib/wiki.ts).
-- 예전에는 서버 메모리에 세어서 서버가 새로 뜨면 0 부터 다시 셌다. 최근 24시간 줄만 남기고 앱이 올릴 때마다 오래된 줄을 지운다.
create table photo_uploads (
  id text primary key,                 -- 사진 id (/api/photos/[id])
  at timestamptz not null,
  device text not null,
  ip text not null
);
create index photo_uploads_at_idx on photo_uploads (at);

-- ───────── 지운 글 · 댓글 · 리스트 (11-19) ─────────
-- 하루 한도를 셀 때 남아 있는 줄만 세면 쓰고 지우기를 되풀이해 한도를 넘을 수 있다 → 지운 것을 한 줄씩 남겨 함께 센다 (src/lib/data/db.ts recentWrites).
-- at = 처음 쓴 시각, device · ip = 쓴 사람. 최근 24시간 안에 쓴 것만 남기고 앱이 줄을 더할 때마다 오래된 줄을 지운다. 화면에는 쓰지 않는다.
create table deleted_writes (
  kind text not null check (kind in ('post', 'comment', 'list')),
  id text not null,                    -- 지운 글 · 댓글 · 리스트의 id
  at timestamptz not null,
  device text not null,
  ip text not null,
  primary key (kind, id)
);
create index deleted_writes_at_idx on deleted_writes (at);
