-- 잠금 (RLS, 11-09) — 공개 키로 표를 바로 읽고 쓰는 길(Data API)에 대비한다.
-- Supabase 는 그 길이 기본으로 열려 있고, Neon(11-20 부터 쓰는 DB)은 Data API 를 켰을 때만 열린다. 지금은 켜지 않는다.
-- 우리 앱은 그 길을 쓰지 않고, 웹 서버가 DB 주인 계정(DATABASE_URL)으로 바로 붙어 규칙(src/lib/data/db.ts)대로 읽고 쓴다.
-- 그래서 표마다 RLS 를 켜고 허용 규칙(policy)은 하나도 두지 않는다 → 공개 키로는 아무것도 못 읽고 못 쓴다.
-- 표 주인은 RLS 를 건너뛰므로 앱은 그대로 돈다 (CI 의 ddy · Neon 의 주인 계정 모두 주인).
-- 기기·접속 위치 해시(device · ip)가 든 표가 많아 공개 키로 열리면 안 된다.

alter table stores enable row level security;
alter table store_logs enable row level security;
alter table reviews enable row level security;
alter table store_votes enable row level security;
alter table store_flags enable row level security;
alter table posts enable row level security;
alter table post_comments enable row level security;
alter table post_likes enable row level security;
alter table place_lists enable row level security;
alter table list_likes enable row level security;
alter table photo_uploads enable row level security;
alter table deleted_writes enable row level security;
