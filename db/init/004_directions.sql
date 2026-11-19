-- 길찾기 누름 기록 (W1-4, 11-11) — 성공 지표 KPI-W01 「주간 길찾기」를 잰다.
-- 가게 상세의 「네이버 지도로 길찾기」「카카오맵」을 누를 때마다 한 줄. 같은 사람(기기와 접속 위치가 모두 같음)이
-- 같은 가게를 같은 날 다시 누르면 더하지 않는다 (규칙은 src/lib/data/db.ts recordGo).
-- 001~003 뒤에 돌린다. 표가 바뀌면 db/README.md 「표가 바뀌면」.
-- 몇 번 눌렸나 보기 (Neon SQL Editor): select date_trunc('week', at) as week, count(*), count(distinct device) from store_directions group by 1 order by 1;

create table if not exists store_directions (
  id text primary key,
  store_id text not null references stores(id) on delete cascade,
  app text not null check (app in ('naver', 'kakao')),
  at timestamptz not null,
  device text not null,
  ip text not null
);
create index if not exists store_directions_at on store_directions (at);

-- 003_rls.sql 과 같은 잠금: 공개 키로는 못 읽고 못 쓴다
alter table store_directions enable row level security;
