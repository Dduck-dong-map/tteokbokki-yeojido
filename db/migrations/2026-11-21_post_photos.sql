-- 떡볶이방 글에 사진 붙이기 (11-21 개발자 제안 · 브랜치 feature/auto-pin-post-photos).
-- 이미 있는 DB(운영 Neon)에만 돌린다. 새 DB 는 init/001_schema.sql 에 같은 칸이 있다.
-- 칸을 더하기만 하므로 새 코드를 배포하기 전에 먼저 돌려도 된다(옛 코드는 이 칸을 읽지 않는다).
-- 거꾸로 이 SQL 을 돌리기 전에 새 코드를 배포하면 앱이 posts.photos 를 읽다 멈춘다 → 반드시 배포 전에.
-- 두 번 돌려도 된다.

alter table posts add column if not exists photos jsonb;
