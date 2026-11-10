# 로컬 DB (도커) — 11-08 · Supabase 준비 11-09

팀장 의견(슬랙 11-07): 「지금은 로컬 DB 를 도커로 돌려서 확인 → 잘 돌아가면 Supabase 연결」. 그 준비다.

- **DB:** PostgreSQL 16 + PostGIS 3.4 (`postgis/postgis:16-3.4`). Supabase 와 같은 종류라 표를 그대로 옮길 수 있다.
- **표:** 컨테이너가 **처음** 뜰 때 아래 세 파일이 차례로 돈다.
  - [`init/001_schema.sql`](init/001_schema.sql) — 가게 · 변경 이력 · 평가 · 맞아요/달라요 · 신고 · 떡볶이방 글·댓글·추천 · 맛집 리스트·추천 (표 10개)
  - [`init/002_postgis.sql`](init/002_postgis.sql) — 가게 위치 · 화면 범위 · 반경 검색 함수. PostGIS 는 `extensions` 칸(스키마)에 깐다 (Supabase 권장, 11-09)
  - [`init/003_rls.sql`](init/003_rls.sql) — 잠금(RLS). 공개 키로는 표를 못 읽고 못 쓰게 한다. 앱은 서버에서 DB 주인 계정으로 붙으므로 영향 없음 (11-09)
- **앱 연결:** `.env.local` 에 `DATABASE_URL` 이 있으면 앱이 파일(루트 `.data/db.json`) 대신 DB 에 저장한다 → [`src/lib/data/pg.ts`](../src/lib/data/pg.ts). 누가 무엇을 할 수 있는지(규칙)는 그대로 [`src/lib/data/db.ts`](../src/lib/data/db.ts) 한 곳이다.
  - 읽기는 표 10개를 **한 번에** 가져온다 (DB 와 한 번만 오감, 11-09). DB 가 멀리 있어도 화면이 덜 느려진다.
  - 이 컴퓨터 DB 가 아니면(= Supabase) 저절로 암호화 연결 · 연결 1개 · 포트 6543 이면 미리 준비한 질의 끄기.
- **처음 켠 빈 DB:** 앱이 처음 읽을 때 예시 가게 16곳 · 글 3 · 리스트 3 을 넣는다. (Supabase 에서도 똑같이 들어간다 → 실제 가게 자료를 넣을 때 예시를 지워야 한다)
- **사진 파일**은 아직 루트 `.data/photos` 폴더에 둔다 (DB 에는 사진 id 만).
- 옛 `web/supabase/migrations/` (10-27 처음 설계안)는 11-09 루트 이동 때 지웠다(깃 이력에만 남음). 옮길 때는 이 폴더의 `init/` 세 파일을 쓴다.

## 쓰는 법

준비: Docker Desktop 을 켜 둔다 (작업 표시줄 고래 아이콘).

```bash
pnpm db:up        # DB 켜기 (처음이면 이미지 받기 + 표 만들기, 1~2분)
cp .env.example .env.local   # 그리고 .env.local 의 DATABASE_URL 줄 앞 # 지우기
pnpm dev -p 3100             # 앱 켜기 → http://127.0.0.1:3100
```

| 명령 | 하는 일 |
| --- | --- |
| `pnpm db:up` | DB 켜기 (127.0.0.1:15432, 이 컴퓨터에서만 열림 · 포트를 바꾸려면 `DDY_DB_PORT=5433 pnpm db:up` 하고 `.env.local` 주소의 포트도 같이 바꾼다) |
| `pnpm db:down` | DB 끄기 (데이터는 남음) |
| `pnpm db:reset` | **데이터를 다 지우고** 표부터 다시 만들기 → 다음에 앱을 열면 예시 데이터로 시작 |
| `pnpm db:psql` | DB 안을 직접 보기 (`\dt` 표 목록, `select * from stores limit 5;`) |

DB 를 그만 쓰려면 `.env.local` 의 `DATABASE_URL` 줄 앞에 `#` 을 붙이고 개발 서버를 다시 켠다 (다시 파일 저장).

접속 정보(이 컴퓨터 안 시험용): `postgres://ddy:ddy_local@127.0.0.1:15432/tteok` · DBeaver 같은 프로그램으로도 열 수 있다.

> **포트 15432 (11-09):** 처음엔 Supabase 로컬 도구와 같은 54322 를 썼는데, 윈도우가 그 근처(54234~54333)를 재부팅 때마다 바뀌는 예약 범위로 잡아 DB 가 안 켜졌다. 그래서 예약 범위(49152 위)에 안 걸리는 15432 로 바꿨다.
> PostGIS 함수를 `db:psql` 에서 직접 부를 때는 `extensions.ST_Y(...)` 처럼 앞에 `extensions.` 를 붙인다 (우리 함수 `stores_in_bounds` · `stores_near` 는 안 붙여도 된다).

## Supabase 로 옮길 때 (코드는 준비됨 · 계정·비밀번호는 사람이)

1. **(사람)** Supabase 에서 새 프로젝트를 만든다. 지역은 **서울(Northeast Asia, Seoul)**, DB 비밀번호를 정해 잘 적어 둔다.
2. **(사람 또는 Claude)** Supabase 화면 왼쪽 **SQL Editor** 에 `init/001_schema.sql` → `002_postgis.sql` → `003_rls.sql` 을 차례로 붙여 넣고 실행한다.
3. **(사람)** 위쪽 **Connect** → **Transaction pooler** 주소(포트 **6543**)를 복사해 비밀번호를 채운다. 모양: `postgres://postgres.<프로젝트ID>:<비밀번호>@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres`
   - 「Direct connection」(포트 5432)은 IPv6 라서 Vercel 에서 안 붙는다. **꼭 pooler** 주소.
4. 먼저 이 컴퓨터에서 확인: `.env.local` 의 `DATABASE_URL` 을 그 주소로 바꾸고 `pnpm dev -p 3100` → 화면이 뜨고 글을 써서 남으면 된다.
5. **(사람)** Vercel 프로젝트 설정 → Environment Variables 에 `DATABASE_URL` · `HASH_SALT`(아무도 모르는 긴 글자) 를 넣고 다시 배포.
   - 권장: Vercel 함수 지역을 **서울(icn1)** 로. 기본(미국)이면 DB(서울)와 멀어 화면마다 느려진다.
6. 남는 일: **사진**은 아직 서버 폴더라 Vercel 에서는 사라진다 → Supabase Storage 로 옮겨야 사진이 남는다 (다음 작업).

참고: [Supabase 연결 안내](https://supabase.com/docs/guides/database/connecting-to-postgres) · [PostGIS 안내](https://supabase.com/docs/guides/database/extensions/postgis)

## 확인한 것

**11-08**
- 표 + PostGIS 3.4.3 생성, 예시 데이터 16곳 모두 위치(location) 자동 채움
- 앱으로 시험: 리스트 만들기 · 가게 넣기·순서 · 다른 기기 고치기 막힘 · 추천 · 글 · 댓글 · 글 추천 · 평가 · 아직 있어요 · 글·리스트 지우기(댓글·추천 같이 지워짐) → 표에 그대로 들어감
- 지도 · 내 맛지도 · 떡볶이방 · 글 · 리스트 · 가게 상세 화면 모두 DB 에서 읽어 정상

**11-09** (시험 스크립트: `docs/만든_스크립트/db_2026-11-09/db_test.mjs`, 깃 제외 · 시험은 전부 복사본 DB 에서 하고 지움)
- 한 번에 읽기 = 예전(표마다 따로) 읽기와 결과 똑같음 · 이 컴퓨터에서 5.3ms → 1.5ms
- 복사본 DB 에 쓰기: 넣기 · 고치기(따옴표·백슬래시 글자, JSON 칸, 위도) · 지우기 · 여러 칸 열쇠 표 · 동시에 5번 쓰기(추천 정확히 5) → 다시 읽어 똑같음
- 잠금: 표 주인이 슈퍼유저가 아닌 계정이어도(= Supabase 와 같은 조건) 앱은 그대로 읽고 씀 · 공개 키 흉내 계정은 가게 0곳, 글 넣기 거절
- 새 002 로 처음부터 만든 DB: PostGIS · `spatial_ref_sys` 가 `extensions` 칸에 · 위치 16곳 채움 · 범위 검색 · 반경 검색 정상
- 이 컴퓨터의 지금 DB 는 11-08 에 만든 것이라 PostGIS 가 `public` 에 있다 (앱은 PostGIS 를 안 써서 상관없음). 다음 `db:reset` 때 새 구조로 바뀐다.

## 아직 안 한 것

- Supabase 프로젝트 만들기 · 연결 (위 1~5, 계정은 사람이)
- 사진을 Supabase Storage 로
- 앱 자체를 도커로 띄우기 (지금은 DB 만 도커, 앱은 `pnpm dev`)
- 지도 화면 범위 조회를 DB 함수(`stores_in_bounds`)로 바꾸기 — 지금은 앱이 전부 읽어 거른다 (가게 수백 곳까지는 충분)
