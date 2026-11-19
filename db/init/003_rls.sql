-- 잠금 (RLS, 11-09) — Supabase 로 옮길 때 대비.
-- Supabase 는 공개 키(anon · authenticated)로 표를 바로 읽고 쓰는 길(Data API)이 열려 있다.
-- 우리 앱은 그 길을 쓰지 않고, 웹 서버가 DB 주인 계정(DATABASE_URL)으로 바로 붙어 규칙(web/src/lib/data/db.ts)대로 읽고 쓴다.
-- 그래서 표마다 RLS 를 켜고 허용 규칙(policy)은 하나도 두지 않는다 → 공개 키로는 아무것도 못 읽고 못 쓴다.
-- 표 주인은 RLS 를 건너뛰므로 앱은 그대로 돈다 (도커의 ddy · Supabase 의 postgres 모두 주인).
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
