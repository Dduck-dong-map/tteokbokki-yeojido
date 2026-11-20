# DB (Neon) — 표 정의와 연결 방법

DB 는 Neon(Postgres + PostGIS), 사진은 Vercel Blob 비공개 저장소를 쓴다(11-20 결정 — Supabase 무료 플랜은 켜진 프로젝트가 계정당 2개라 자리가 없었다). 로컬 도커 DB 와 도커 앱 서버는 11-19 에 지웠다. Neon 프로젝트는 11-20 에 만들어 표 13개를 올렸다(프로젝트 `tteokbokki-yeojido` · id `round-fire-19486533` · 싱가포르 · Postgres 16 — 아래 「Neon 연결」 1~3 끝). Vercel 프로젝트와 Blob 저장소도 11-20 에 만들어 사진 왕복을 확인했다(5 · 6). 배포와 환경 변수(7)는 아직이다.

- **표:** 새 DB 에 아래 네 파일을 차례로 돌린다. CI(`.github/workflows/ci.yml` 의 `postgres` 작업)가 푸시마다 빈 Postgres 에 돌려 본다.
  - [`init/001_schema.sql`](init/001_schema.sql) — 가게 · 변경 이력 · 평가 · 맞아요/달라요 · 신고 · 떡볶이방 글·댓글·추천 · 맛집 리스트·추천 · 사진 하루 한도(`photo_uploads`) · 지운 글·댓글·리스트의 하루 한도 줄(`deleted_writes`) (표 12개)
  - [`init/002_postgis.sql`](init/002_postgis.sql) — 가게 위치 · 화면 범위 · 반경 검색 함수. PostGIS 는 `extensions` 칸(스키마)에 깐다
  - [`init/003_rls.sql`](init/003_rls.sql) — 잠금(RLS). 001 의 표 12개 모두 켜고 허용 규칙은 두지 않는다 → 공개 키로는 표를 못 읽고 못 쓴다. 앱은 서버에서 DB 주인 계정으로 붙으므로 영향 없음
  - [`init/004_directions.sql`](init/004_directions.sql) — 길찾기 누름 기록 `store_directions`(성공 지표 KPI-W01). 표는 이것까지 13개이고 이 표도 잠금(RLS)을 켠다
- **앱 연결:** `.env.local`(로컬) · Vercel 환경 변수(배포)에 `DATABASE_URL` 이 있으면 앱이 파일(루트 `.data/db.json`) 대신 DB 에 저장한다 → [`src/lib/data/pg.ts`](../src/lib/data/pg.ts). 누가 무엇을 할 수 있는지(규칙)는 [`src/lib/data/db.ts`](../src/lib/data/db.ts) 한 곳이다.
  - 읽기는 표 13개를 **한 번에** 가져온다 (DB 와 한 번만 오감). 기록 표(변경 이력 · 길찾기 · 사진 올림)는 규칙에 필요한 최근 줄만 싣는다.
  - 이 컴퓨터의 Postgres 가 아니면(= Neon) 저절로 암호화 연결 · 연결 1개. 풀러 주소(호스트 이름에 `-pooler`)면 미리 준비한 질의를 끈다.
- **예시 데이터:** 앱에 없다(11-19 에 뺌). DB 도 파일 저장소도 빈 채로 시작하고, 실제 가게는 아래 「가게 넣는 순서」로 넣는다. 시험만 `tests/fixtures/` 의 자료로 저장소를 채운다.
- **사진 파일:** Vercel Blob 저장소가 이어져 있으면(`BLOB_STORE_ID` 또는 `BLOB_READ_WRITE_TOKEN`) 비공개로 거기에, 없으면 루트 `.data/photos` 폴더에 둔다 → [`src/lib/data/photos.ts`](../src/lib/data/photos.ts). 임시 자리다(무료 한도: 저장 1GB · 올리기 월 2,000회, 넘으면 30일 동안 못 쓴다). DB 에는 사진 id 만 둔다. 하루 한도(한 사람 30장 + 같은 접속 위치 150장)는 `photo_uploads` 표로 센다.

## 쓰는 법

```bash
cp .env.example .env.local   # DATABASE_URL 줄의 # 을 지우고 Neon 의 Pooled connection 주소를 넣는다
pnpm dev                     # 앱 켜기 → http://localhost:3000
```

`DATABASE_URL` 이 Neon 주소면 개발 서버의 어드민도 `ADMIN_KEY` 가 있어야 열린다(`src/lib/admin/access.ts`). DB 를 그만 쓰려면 `.env.local` 의 `DATABASE_URL` 줄 앞에 `#` 을 붙이고 개발 서버를 다시 켠다(다시 파일 저장).

### 가게 넣는 순서 (빈 DB 에서)

1. 아래 「Neon 연결」 1~3 으로 빈 DB 를 만든다.
2. 앱을 그 DB 에 붙여 켜고, `ADMIN_KEY` 를 넣어 `/admin/login` 에서 들어간다.
3. `/admin/candidates` 「후보 가져오기」에서 리서치 묶음(강남 · 마포, `src/lib/data/datasets.ts`)을 가져온다. 빈 칸이 남은 줄은 「채워서 등록」으로 열어 채운다.
4. `/admin/stores` 에서 들어간 가게를 확인하고 지도 홈에서 보이는지 본다.

### 표가 바뀌면

표가 하나라도 없으면 앱이 DB 를 못 읽는다(표 13개를 한 번에 읽는다).

- **지킬 데이터가 없는 동안**(가게를 넣기 전): Neon SQL Editor 에서 표를 지우고 `init/*.sql` 을 다시 차례로 돌린다. 가게는 「가게 넣는 순서」로 다시 넣는다.
- **운영 데이터가 생긴 뒤:** 표를 지울 수 없다. 바꾸는 SQL 을 따로 써서 적용한다.
  1. `db/migrations/` 에 `YYYY-MM-DD_무엇.sql` 로 바꾸는 SQL(`alter table …`)을 쓴다. 두 번 돌려도 되게 쓴다(`add column if not exists` · `drop column if exists` · `create index if not exists`). 값을 옮겨야 하면 같은 파일 안에서 「칸 더하기 → 값 채우기 → 옛 칸 지우기」 순서로 쓴다.
  2. `init/*.sql` 도 같은 모양으로 고친다. 새 DB 는 `init` 만 돌리고, `migrations` 는 이미 있는 DB 에만 돌린다. 둘을 다 돌린 결과가 같아야 한다.
  3. 표 · 칸이 늘거나 줄면 `src/lib/data/pg.ts` 의 표 · 칸 대응과 `src/lib/data/db.ts` 의 `Db` · `blank()` 를 함께 고친다. 새 표에는 RLS 를 켠다(`alter table … enable row level security`).
  4. PR 을 올려 CI 의 `postgres` 작업(`init` 으로 새로 만든 DB 에서 `pg.test.ts`)이 통과하는지 본다.
  5. Neon 콘솔에서 되돌릴 시점(무료는 최근 6시간)을 확인한 뒤 SQL Editor 에 `migrations` 파일을 날짜 순서로 붙여 넣어 돌린다. 칸을 지우거나 이름을 바꾸는 SQL 은 새 코드를 배포하기 **직전에** 돌린다(옛 코드는 없는 칸을 읽다 멈춘다). 칸을 더하기만 하는 SQL 은 배포 **전에** 먼저 돌려도 된다.
  6. 적용한 날짜와 파일 이름을 `docs/작업기록.md` 에 적는다.

### 자동 시험

`tests/unit/pg.test.ts` 는 `DATABASE_URL` 이 있을 때만 돈다. 그 서버에 시험용 DB(`ddy_test_…`)를 새로 만들어 `init/*.sql` 을 돌리고 끝나면 지운다. CI 의 `postgres` 작업이 CI 안에서만 뜨는 Postgres 로 돌린다. **Neon 주소로는 돌리지 않는다.** 로컬에서 돌리려면 내 컴퓨터에 따로 띄운 Postgres + PostGIS 주소를 `DATABASE_URL` 로 준다.

## Neon 연결 (코드는 준비됨 · 계정·비밀번호는 사람이)

1~3 은 11-20 에 끝냈다(Claude 가 Neon MCP 로). 새 DB 를 다시 만들 때는 같은 순서로 한다.

1. **(끝 · 11-20)** [Neon](https://neon.com) 에서 새 프로젝트를 만든다. 지역은 **AWS 싱가포르(`aws-ap-southeast-1`)** — 서울 · 도쿄 지역은 없다. 무료 플랜은 프로젝트 100개 · 프로젝트당 1GB 다.
2. **(끝 · 11-20)** Neon 콘솔 왼쪽 **SQL Editor** 에 `init/001_schema.sql` → `002_postgis.sql` → `003_rls.sql` → `004_directions.sql` 을 차례로 붙여 넣고 실행한다. (`psql "<주소>" -f db/init/001_schema.sql` 처럼 돌려도 된다.)
3. **(끝 · 11-20)** **Connect** 에서 **Connection pooling** 을 켠 주소를 복사한다. 모양: `postgresql://<계정>:<비밀번호>@ep-<이름>-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require` — 호스트 이름에 `-pooler` 가 들어 있어야 한다(Vercel 처럼 서버가 떴다 사라지는 곳에서는 풀러로 붙는다). Neon 이 주는 주소에 `channel_binding=require` 가 붙어 있으면 빼고 `sslmode=require` 만 남긴다. 주소는 이 컴퓨터의 `.env.local` 에 넣어 두었다(깃 제외).
4. **(사람)** 먼저 이 컴퓨터에서 확인: `.env.local` 의 `DATABASE_URL` 을 그 주소로 바꾸고 `ADMIN_KEY` 도 넣은 뒤 `pnpm dev` → 화면이 뜨고 글을 써서 남으면 된다. 가게 등록 · 맞아요 · 평가 · 길찾기를 한 번씩 해 본다(쓰기는 `pg_advisory_xact_lock` 을 잡는다 — 풀러에서 처음 붙여 보는 것이라 여기서 확인한다).
5. **(사람)** Vercel 에 프로젝트를 만든다. 이 저장소는 깃허브 조직 소유라 무료(Hobby) 플랜에서는 깃 연결이 안 된다 → 이 컴퓨터에서 `vercel link` 뒤 `vercel --prod` 로 올린다.
6. **(사람)** Vercel 대시보드 **Storage** → **Blob** 저장소를 **Private** 으로 만들고(지역 싱가포르 `sin1`) 그 프로젝트에 잇는다. 이으면 `BLOB_STORE_ID` 가 저절로 들어가 열쇠 없이 붙는다. 사진은 앱 서버가 넣고 `/api/photos/<id>` 로 받아 내려 준다 (`src/lib/data/photos.ts`).
   - 이 컴퓨터에서 확인: `vercel env pull .env.local` 로 값을 받은 뒤 사진을 올려 저장소에 `photos/<id>.jpg` 가 생기는지 본다.
7. **(사람)** Vercel 프로젝트 설정 → Environment Variables 에 `DATABASE_URL` · `HASH_SALT`(아무도 모르는 긴 글자) · `ADMIN_KEY` · `NEXT_PUBLIC_SITE_URL` 을 넣고 다시 배포. (`DATABASE_URL` 에 `NEXT_PUBLIC_` 을 붙이지 않는다)
   - 권장: Vercel 함수 지역을 **싱가포르(`sin1`)** 로. 기본(미국)이면 DB(싱가포르)와 멀어 화면마다 느려진다.
   - Blob 저장소가 이어져 있지 않으면 Vercel 에서는 사진 올리기를 거절한다(사진 없이 등록은 된다).
   - `DATABASE_URL` 이 비어 있으면 Vercel 에서는 서버가 시작하지 않는다(11-18, `HASH_SALT` 와 같음).
8. **(사람)** 빈 DB 에 실제 가게를 넣는다 — 위 「가게 넣는 순서」.

알아 둘 것: Neon 무료 플랜은 5분 동안 요청이 없으면 DB 가 잠들고 다음 요청에 저절로 깬다(그 요청은 느리다). 끌 수 없다.

참고: [Neon 연결 풀링](https://neon.com/docs/connect/connection-pooling) · [Neon 지역](https://neon.com/docs/introduction/regions) · [Vercel Blob](https://vercel.com/docs/vercel-blob) · [Vercel Blob 요금 · 한도](https://vercel.com/docs/vercel-blob/usage-and-pricing)

## 확인한 것 (Neon)

**11-20**
- 프로젝트 `tteokbokki-yeojido`(id `round-fire-19486533` · AWS 싱가포르 · Postgres 16.16)를 만들고 `init/001`~`004` 를 한 트랜잭션으로 적용했다.
- 표 13개 모두 RLS 켜짐 · 인덱스 22개 · 함수 3개(`stores_set_location` · `stores_in_bounds` · `stores_near`) · 트리거 `stores_location`.
- PostGIS 는 `extensions` 칸에 3.3.10 으로 깔렸다(CI 는 3.4). `002_postgis.sql` 은 그대로 돈다.
- 이 컴퓨터에서 앱과 같은 옵션(`postgres` · 연결 1개 · ssl · 미리 준비한 질의 끔)으로 풀러 주소에 붙어 읽기와 `pg_advisory_xact_lock` 이 통과했다.
- 앱 서버로 쓰기 4종 확인: Neon 가지 `dev-check-2026-11-20`(id `br-rough-haze-b3ho10n2`)에 붙인 `pnpm build` + `next start` 에서 등록(1.5초) → 맞아요 → 평가 → 길찾기(각 0.4~0.6초)가 저장되고, 가게 상세 · 지도 홈에 다시 보인다. 가지의 `stores` 1 · `store_votes` 1 · `reviews` 1 · `store_directions` 1 · `location` 자동 채움. 본 DB 는 0줄 그대로다.
- 찾은 버그: `.env.example` 을 복사하면 `DATABASE_POOL=` 이 빈 글자로 오는데 `pg.ts` 가 `??` 로 받아 연결 0개가 되고, 빌드(「Collecting page data」)와 모든 질의가 오류 없이 끝없이 멈췄다 → `||` 로 고쳤다.
- 확인이 끝나 가지 `dev-check-2026-11-20` 는 지웠다.
- 아직 안 본 것: 잠든 DB 가 깨는 첫 요청 시간 · `ADMIN_KEY` 를 넣은 어드민 화면.

## 확인한 것 (Vercel Blob)

**11-20**
- Vercel 프로젝트 `lucetas-projects/tteokbokki-yeojido` 를 `vercel link` 로 만들었다(깃 연결은 조직 소유 저장소라 실패 — CLI 로 배포한다). 배포는 아직 하지 않았다.
- 비공개 저장소 `tteokbokki-photos`(id `store_oj0OAZSco1hr9ayo` · `sin1`)를 `vercel blob create-store` 로 만들어 production · preview · development 에 이었다. 이 컴퓨터의 `.env.local` 에 `BLOB_READ_WRITE_TOKEN` 이 들어와 있어, 로컬에서 올리는 사진도 이 저장소로 간다(무료 한도를 쓴다). 로컬 폴더에 두려면 그 줄을 비운다.
- `next start`(파일 저장소 모드)에서 사진 올리기 201(1.0초) → `/api/photos/<id>` 200 `image/jpeg` 내용 같음(0.7초). 저장소에 `photos/<id>.jpg` 로 있고 저장소 주소로 직접 열면 403. 시험 사진 1장(125B)이 저장소에 남아 있다.

## 확인한 것 (도커 시절 기록)

아래는 로컬 도커 DB · 도커 앱 서버로 확인한 기록이다. 여기 나오는 `pnpm db:*` · `pnpm app:*` 명령과 도커 파일은 11-19 에 지웠다.

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
- `tests/unit/pg.test.ts`: `DATABASE_URL` 이 있으면 그 서버에 시험용 DB(`ddy_test_…`)를 새로 만들어 `init/*.sql` 을 돌리고 끝나면 지운다 (그 주소의 DB 표는 건드리지 않는다 · DB 를 만들 권한이 필요). 빈 DB 는 빈 저장소(아무것도 써 넣지 않음) · 저장 흐름 · 동시 추천 5 · public 표 모두 RLS 켜짐 · anon 역할은 읽기 0줄 · 넣기 거절. CI(`.github/workflows/ci.yml`)가 같은 이미지로 돌린다.

## 아직 안 한 것

- 화면에서 Neon 저장 확인 · Vercel 배포 · 가게 넣기 (위 「Neon 연결」 4~8). `.env.local` 의 `ADMIN_KEY` · `HASH_SALT` 는 아직 비어 있다 — `HASH_SALT` 는 Vercel 과 같은 값을 써야 같은 사람의 해시가 같아진다
- 사진을 Vercel Blob 으로 — 코드는 준비됨(11-20, 위 6). 저장소 만들기 · 실제 올리기 확인은 Vercel 프로젝트를 만든 뒤
- 지도 화면 범위 조회를 DB 함수(`stores_in_bounds`)로 바꾸기 — 지금은 앱이 전부 읽어 거른다 (가게 수백 곳까지는 충분)
