# 로컬 DB (도커) — 11-08 · Supabase 준비 11-09

팀장 의견(슬랙 11-07): 「지금은 로컬 DB 를 도커로 돌려서 확인 → 잘 돌아가면 Supabase 연결」. 그 준비다.

- **DB:** PostgreSQL 16 + PostGIS 3.4 (`postgis/postgis:16-3.4`). Supabase 와 같은 종류라 표를 그대로 옮길 수 있다.
- **표:** 컨테이너가 **처음** 뜰 때 아래 네 파일이 차례로 돈다. 표가 바뀌면 아래 「표가 바뀌면」대로 DB 를 새로 만든다.
  - [`init/001_schema.sql`](init/001_schema.sql) — 가게 · 변경 이력 · 평가 · 맞아요/달라요 · 신고 · 떡볶이방 글·댓글·추천 · 맛집 리스트·추천 · 사진 하루 한도(`photo_uploads`, 11-18) · 지운 글·댓글·리스트의 하루 한도 줄(`deleted_writes`, 11-19) (표 12개)
  - [`init/002_postgis.sql`](init/002_postgis.sql) — 가게 위치 · 화면 범위 · 반경 검색 함수. PostGIS 는 `extensions` 칸(스키마)에 깐다 (Supabase 권장, 11-09)
  - [`init/003_rls.sql`](init/003_rls.sql) — 잠금(RLS). 001 의 표 12개 모두 켜고 허용 규칙은 두지 않는다 → 공개 키로는 표를 못 읽고 못 쓴다. 앱은 서버에서 DB 주인 계정으로 붙으므로 영향 없음 (11-09)
  - [`init/004_directions.sql`](init/004_directions.sql) — 길찾기 누름 기록 `store_directions`(성공 지표 KPI-W01, 11-11). 표는 이것까지 13개이고 이 표도 잠금(RLS)을 켠다
- **앱 연결:** `.env.local` 에 `DATABASE_URL` 이 있으면 앱이 파일(루트 `.data/db.json`) 대신 DB 에 저장한다 → [`src/lib/data/pg.ts`](../src/lib/data/pg.ts). 누가 무엇을 할 수 있는지(규칙)는 그대로 [`src/lib/data/db.ts`](../src/lib/data/db.ts) 한 곳이다.
  - 읽기는 표 13개를 **한 번에** 가져온다 (DB 와 한 번만 오감, 11-09). DB 가 멀리 있어도 화면이 덜 느려진다.
  - 이 컴퓨터 DB 가 아니면(= Supabase) 저절로 암호화 연결 · 연결 1개 · 포트 6543 이면 미리 준비한 질의 끄기.
- **처음 켠 빈 DB (11-18 바뀜):** 예시 가게 16곳 · 글 3 · 리스트 3 은 **`SEED_SAMPLES=1` 일 때만** 앱이 처음 읽을 때 넣는다 (`.env.local`). 값이 없으면 빈 DB 그대로 시작하고 아무것도 쓰지 않는다 — 운영 DB(Supabase)에 예시가 들어가지 않게. 「빈 DB」는 표가 **모두** 빈 때다(가게만 비고 글이 있으면 예시를 넣지 않는다). 파일 저장소(`DATABASE_URL` 없음)는 이 값과 상관없이 늘 예시로 시작한다. 실제 가게는 아래 「가게 넣는 순서」.
- **사진 파일** (11-18 바뀜): Supabase Storage 설정(`SUPABASE_URL` · `SUPABASE_SERVICE_ROLE_KEY`)이 있으면 비공개 버킷에, 없으면 루트 `.data/photos` 폴더에 둔다 → [`src/lib/data/photos.ts`](../src/lib/data/photos.ts). DB 에는 사진 id 만 둔다. 하루 한도(한 사람 30장 + 같은 접속 위치 150장)는 `photo_uploads` 표로 센다.
- 옛 `web/supabase/migrations/` (10-27 처음 설계안)는 11-09 루트 이동 때 지웠다(깃 이력에만 남음). 옮길 때는 이 폴더의 `init/` 네 파일을 쓴다.

## 쓰는 법

준비: Docker Desktop 을 켜 둔다 (작업 표시줄 고래 아이콘).

```bash
pnpm db:up        # DB 켜기 (처음이면 이미지 받기 + 표 만들기, 1~2분)
cp .env.example .env.local   # 그리고 .env.local 의 DATABASE_URL 줄 앞 # 지우기 (예시가 필요하면 SEED_SAMPLES=1 줄 앞 # 도)
pnpm dev -p 3100             # 앱 켜기 → http://127.0.0.1:3100
```

### 가게 넣는 순서 (빈 DB 에서)

예시 없이(`SEED_SAMPLES` 없이) 시작한 DB 는 가게가 0곳이다. 표가 바뀌어 `pnpm db:reset` 을 한 뒤에도 이 순서로 다시 넣는다. 실제 가게는 어드민으로 넣는다.

1. 빈 DB 를 만든다: 로컬은 `pnpm db:reset`, Supabase 는 아래 「Supabase 로 옮길 때」 1~2. `SEED_SAMPLES` 는 넣지 않는다.
2. 앱을 그 DB 에 붙여 켠다. 개발 서버(`pnpm dev`)면 `ADMIN_KEY` 없이 127.0.0.1 주소로 어드민이 열리고, production(`pnpm start` · 도커 앱 · Vercel)이면 `ADMIN_KEY` 를 넣고 `/admin/login` 에서 들어간다 (11-18 부터 production 은 열쇠 없이 늘 잠김).
3. `/admin/candidates` 「후보 가져오기」에서 리서치 묶음(강남 · 마포, `src/lib/data/datasets.ts`)을 가져온다. 빈 칸이 남은 줄은 「채워서 등록」으로 열어 채운다.
4. `/admin/stores` 에서 들어간 가게를 확인하고 지도 홈에서 보이는지 본다.

| 명령 | 하는 일 |
| --- | --- |
| `pnpm db:up` | DB 켜기 (127.0.0.1:15432, 이 컴퓨터에서만 열림 · 포트를 바꾸려면 `DDY_DB_PORT=5433 pnpm db:up` 하고 `.env.local` 주소의 포트도 같이 바꾼다) |
| `pnpm db:down` | DB 끄기 (데이터는 남음) |
| `pnpm db:reset` | **데이터를 다 지우고** 표부터 다시 만들기 → 다음에 앱을 열면 빈 DB 로 시작 (`SEED_SAMPLES=1` 이면 예시 데이터로) |
| `pnpm db:psql` | DB 안을 직접 보기 (`\dt` 표 목록, `select * from stores limit 5;`) |

### 표가 바뀌면 (11-18)

이미 쓰던 DB 를 고치는 절차(옛 `pnpm db:update`)는 두지 않는다. 표 정의(`init/*.sql`)가 바뀌면 DB 를 새로 만든다. 표가 하나라도 없으면 앱이 DB 를 못 읽는다(표 13개를 한 번에 읽는다).

1. `pnpm db:reset` — 데이터를 다 지우고 새 표 정의로 다시 만든다.
2. 어드민 `/admin/candidates` 「후보 가져오기」로 가게를 다시 넣는다 (위 「가게 넣는 순서」 2~4).

지금은 지킬 데이터가 없어서 이렇게 한다(사용자 결정 11-18). **Supabase 에 연결한 뒤에는 리셋으로 바꿀 수 없다** — 운영 데이터가 지워진다. 그때부터 표를 바꾸려면 바꾸는 SQL 을 따로 써서 Supabase 에 적용해야 하므로, 표 설계는 연결 전에 마친다.

DB 를 그만 쓰려면 `.env.local` 의 `DATABASE_URL` 줄 앞에 `#` 을 붙이고 개발 서버를 다시 켠다 (다시 파일 저장).

접속 정보(이 컴퓨터 안 시험용): `postgres://ddy:ddy_local@127.0.0.1:15432/tteok` · DBeaver 같은 프로그램으로도 열 수 있다.

> **포트 15432 (11-09):** 처음엔 Supabase 로컬 도구와 같은 54322 를 썼는데, 윈도우가 그 근처(54234~54333)를 재부팅 때마다 바뀌는 예약 범위로 잡아 DB 가 안 켜졌다. 그래서 예약 범위(49152 위)에 안 걸리는 15432 로 바꿨다.
> PostGIS 함수를 `db:psql` 에서 직접 부를 때는 `extensions.ST_Y(...)` 처럼 앞에 `extensions.` 를 붙인다 (우리 함수 `stores_in_bounds` · `stores_near` 는 안 붙여도 된다).

## 앱 서버 (도커, 11-11)

배포처를 정하기 전에, 배포할 때와 똑같이 빌드한 앱을 이 컴퓨터의 도커에 띄워 본다 (사용자 11-11: 「로컬로 도커 써서 서버 구축하고 테스트 후에 결정」).
만드는 법은 루트 [`Dockerfile`](../Dockerfile)(next build → standalone), 띄우는 설정은 [`docker-compose.yml`](../docker-compose.yml) 의 `app`.

```bash
pnpm app:up     # 빌드 + 켜기 (DB 도 같이 켜짐, 처음 3~5분) → http://127.0.0.1:3000
pnpm app:logs   # 서버 기록 보기 (Ctrl+C 로 나옴)
pnpm app:down   # 끄기
```

- **DB:** 개발 서버와 같은 `tteok` 를 쓴다 (컨테이너끼리 `db:5432` 로 붙음). 시험할 땐 복사본을 만들어 `DDY_APP_DB=tteok_test` 로 고른다.
- **포트:** 3000 — 개발 서버(`pnpm dev --port 3000`)와 같아서 **둘 중 하나만** 켠다. 바꾸려면 `DDY_APP_PORT=3200`. 같은 와이파이의 폰으로 보려면 `DDY_APP_HOST=0.0.0.0` (윈도우 방화벽이 물으면 허용).
- **사진:** 개발 서버와 같은 `.data/photos` 폴더를 쓴다 (도커 앱에는 Supabase Storage 값을 넘기지 않아 늘 폴더다)
- **빌드 때 박히는 값:** `.env.local` 의 `NEXT_PUBLIC_NAVER_MAP_KEY_ID` · `NEXT_PUBLIC_SAMPLE_DATA` · `NEXT_PUBLIC_SITE_URL`. 바꾸면 `pnpm app:up` 을 다시 하면 된다(매번 빌드).
- **HASH_SALT:** 비우면 개발 서버와 같은 기본값이라 두 서버가 같은 사람을 같게 센다. 이 서버를 밖에 열 땐 긴 글자를 넣는다.
- 빌드는 DB 없이 예시 데이터로 한다. 화면은 요청마다 DB 에서 새로 읽으므로 상관없고, `sitemap.xml` 만 빌드 때 가게 목록으로 정해진다.

## Supabase 로 옮길 때 (코드는 준비됨 · 계정·비밀번호는 사람이)

1. **(사람)** Supabase 에서 새 프로젝트를 만든다. 지역은 **서울(Northeast Asia, Seoul)**, DB 비밀번호를 정해 잘 적어 둔다.
2. **(사람 또는 Claude)** Supabase 화면 왼쪽 **SQL Editor** 에 `init/001_schema.sql` → `002_postgis.sql` → `003_rls.sql` → `004_directions.sql` 을 차례로 붙여 넣고 실행한다.
3. **(사람)** 위쪽 **Connect** → **Transaction pooler** 주소(포트 **6543**)를 복사해 비밀번호를 채운다. 모양: `postgres://postgres.<프로젝트ID>:<비밀번호>@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres`
   - 「Direct connection」(포트 5432)은 IPv6 라서 Vercel 에서 안 붙는다. **꼭 pooler** 주소.
4. 먼저 이 컴퓨터에서 확인: `.env.local` 의 `DATABASE_URL` 을 그 주소로 바꾸고 `pnpm dev -p 3100` → 화면이 뜨고 글을 써서 남으면 된다.
5. **(사람)** 같은 프로젝트 왼쪽 **Storage** → **New bucket** 으로 사진 버킷을 만든다. 이름 `photos`(다르면 `SUPABASE_PHOTO_BUCKET` 에 적는다), **Public bucket 은 끈다(비공개)**. 사진은 앱 서버가 service role 키로 넣고 `/api/photos/<id>` 로 받아 내려 준다 (`src/lib/data/photos.ts`).
   - 권장: 버킷 설정에서 파일 크기 3MB · 형식 `image/jpeg` 로 제한 (앱도 같은 검사를 한다).
   - 이 컴퓨터에서 확인: `.env.local` 에 `SUPABASE_URL`(Project Settings → API 의 Project URL) · `SUPABASE_SERVICE_ROLE_KEY` 를 넣고 사진을 올려 버킷에 `<id>.jpg` 가 생기는지 본다.
6. **(사람)** Vercel 프로젝트 설정 → Environment Variables 에 `DATABASE_URL` · `HASH_SALT`(아무도 모르는 긴 글자) · `SUPABASE_URL` · `SUPABASE_SERVICE_ROLE_KEY` 를 넣고 다시 배포. (`NEXT_PUBLIC_` 을 붙이지 않는다)
   - 권장: Vercel 함수 지역을 **서울(icn1)** 로. 기본(미국)이면 DB(서울)와 멀어 화면마다 느려진다.
   - Storage 값이 비어 있으면 Vercel 에서는 사진 올리기를 거절한다(사진 없이 등록은 된다).
   - `DATABASE_URL` 이 비어 있으면 Vercel 에서는 서버가 시작하지 않는다(11-18, `HASH_SALT` 와 같음). `SEED_SAMPLES` 는 넣지 않는다. 어드민을 쓰려면 `ADMIN_KEY` 도 넣는다.
7. **(사람)** 빈 DB 에 실제 가게를 넣는다 — 위 「가게 넣는 순서」.

참고: [Supabase 연결 안내](https://supabase.com/docs/guides/database/connecting-to-postgres) · [PostGIS 안내](https://supabase.com/docs/guides/database/extensions/postgis) · [Storage 올리기](https://supabase.com/docs/guides/storage/uploads/standard-uploads) · [Storage 내려받기](https://supabase.com/docs/guides/storage/serving/downloads)

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

**11-11** (앱 서버)
- `pnpm app:up` 으로 빌드·실행 → 상태 정상(healthy). 복사본 DB(`tteok_test`)에 붙여 HTTP 시험 46/46: 화면 18곳 열림 · 사진 없이 등록 → 상세·지도에 보임 · 같은 자리 같은 이름 409 · 맞아요·같은 사람 두 번 막힘 · 평가 · 아직 있어요 · 고치기 → 이력 · 길찾기 기록(같은 사람·같은 가게·같은 날 한 줄) · 사진 올리기·받기 · 글·댓글·추천 · 리스트·남의 리스트 막힘·추천. 끝나고 복사본 DB·시험 사진 지움

**11-18** (자동 시험)
- `tests/unit/pg.test.ts`: `DATABASE_URL` 이 있으면 그 서버에 시험용 DB(`ddy_test_…`)를 새로 만들어 `init/*.sql` 을 돌리고 끝나면 지운다 (그 주소의 DB 표는 건드리지 않는다 · DB 를 만들 권한이 필요). 빈 DB 에 예시 안 넣기 · `SEED_SAMPLES=1` 이면 한 번만 넣기 · 저장 흐름 · 동시 추천 5 · public 표 모두 RLS 켜짐 · anon 역할은 읽기 0줄 · 넣기 거절. CI(`.github/workflows/ci.yml`)가 같은 이미지로 돌린다.
- 로컬에서 돌리기: `pnpm db:up` 뒤 `DATABASE_URL=postgres://ddy:ddy_local@127.0.0.1:15432/tteok pnpm exec vitest run tests/unit/pg.test.ts`

## 아직 안 한 것

- Supabase 프로젝트 만들기 · 연결 (위 1~7, 계정은 사람이)
- 사진을 Supabase Storage 로 — 코드는 준비됨(11-18, 위 5). 버킷 만들기 · 실제 올리기 확인은 프로젝트를 만든 뒤
- 지도 화면 범위 조회를 DB 함수(`stores_in_bounds`)로 바꾸기 — 지금은 앱이 전부 읽어 거른다 (가게 수백 곳까지는 충분)
