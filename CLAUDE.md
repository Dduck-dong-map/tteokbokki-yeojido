# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

떡볶여지도: 떡 종류·스타일·맵기로 찾는 떡볶이 맛집 지도. 가입 없이 누구나 가게를 올리고 고치며, 「맞아요·달라요」로 걸러 내는 "모두가 고치는 지도"다. 저장소 루트가 Next.js 앱 본체다(옛 `web/` 은 11-09 에 해체). 기획·시안·기록은 `docs/` 에 두고, 기획안·시안은 덮어쓰지 않고 v1, v2 로 따로 둔다.

## 명령

pnpm 만 쓴다 (`packageManager: pnpm@10.33.0`).

```bash
pnpm dev            # 개발 서버. predev 가 MapLibre 일꾼 파일·공유 HTML 을 public/ 에 복사한다
pnpm build          # prebuild 도 같은 복사를 한다
pnpm typecheck      # next typegen && tsc --noEmit (라우트 타입 PageProps 등을 먼저 만든다)
pnpm lint           # eslint — 디자인 시스템 금지 규칙도 본다 (임의 글자 크기 · 임의 색 · ui/ 밖 날 입력 요소 · 어드민 CSS)
pnpm test           # vitest — tests/unit/**/*.test.ts (규칙 함수 · 저장소 쓰기 규칙 · 쓰기 입구 · 어드민 접근 · 사진 저장소. pg.test.ts 는 DATABASE_URL 이 있을 때만)
pnpm e2e            # Playwright — 라우트 열림 + 저장 흐름 + 수용 기준(acceptance.spec.ts) × 폭 390·768·1280
pnpm tokens         # docs/design-system/tokens.json → src/app/tokens.css 생성

# 하나만 돌리기
pnpm exec vitest run tests/unit/wiki.test.ts -t "테스트 이름"
pnpm exec playwright test tests/e2e/flows.spec.ts --project=mobile-390 -g "테스트 이름"
```

DB 는 Supabase 다(`db/README.md`). 로컬 도커 DB · 도커 앱 서버와 `pnpm db:*` · `pnpm app:*` 명령은 11-19 에 지웠다. `DATABASE_URL` 이 없으면 파일 저장소로 돈다.

E2E 는 3101 포트에 **파일 저장소 모드**(`DATA_DIR=.data-e2e`, 시험 자료로 채움)로 따로 띄우고 `DATABASE_URL`·네이버 키를 비우고 시험용 `ADMIN_KEY` 를 넣는다. 개발 DB 는 건드리지 않는다. 개발 서버가 떠 있으면 Next 16 의 dev 잠금(`.next/dev/lock`) 때문에 저절로 `next build` + `next start` 로 돈다. `E2E_SERVER=dev|start` 로 고를 수 있다(`playwright.config.ts`).

CI(`.github/workflows/ci.yml`)는 푸시·PR 마다 타입 검사 · 린트 · 단위 시험을 돌리고, CI 안의 Postgres 서비스에 `db/init/*.sql` 을 적용해 PG 시험(`tests/unit/pg.test.ts`)까지 돈다. E2E 도 세 폭으로 돈다(개발 서버 모드).

## Next.js 주의

이 저장소는 Next.js 16.4 (App Router · `cacheComponents` · `partialPrefetching`) 다. 번들 문서를 먼저 읽으라는 규칙은 위에서 불러온 `AGENTS.md` 에 있다. 이 파일은 `next dev` 가 저절로 만들므로 손으로 고치지 않는다. 데이터는 기본이 동적이고, 캐시는 필요한 곳에만 `"use cache"` 로 둔다.

## 구조 (여러 파일을 봐야 알 수 있는 것)

**화면 = 컨테이너 + View.** (자세한 작성 규칙은 컴포넌트 패턴 가이드 2장) 화면마다 `X.tsx`(상태·데이터·라우터·브라우저 API)와 `XView.tsx`(props 만 받아 그리는 정적 마크업)로 나뉜다. View 의 props 계약은 `src/components/<screen>/types.ts` 에 둔다. 예: `components/home/MapShell.tsx` → `MapShellView.tsx`. 공용 부품은 `components/ui/`(shadcn, base-nova · `@base-ui/react`), `brand/`(도장·별점·로고 등 우리 것), `layout/`(헤더·아래 메뉴·격자)에 둔다.

**라우트 묶음.** `src/app/(site)/` 이 사용자 화면이다. `(site)/(map)/layout.tsx` 는 지도 홈 `/` 와 가게 상세 `/store/[id]` 가 함께 쓰는 틀이다. PC 에서 상세를 열어도 큰 지도가 이어지도록 지도를 레이아웃에 둔다. `src/app/admin/` 은 운영 어드민이다. 화면은 가게 관리 · 후보 가져오기 · 운영 기록 셋이고 모두 실제 저장소를 읽고 고친다(Server Action `admin/actions.ts` → `lib/data/admin.ts`). `/admin` 은 가게 관리로 넘긴다. 시안이던 홈 · 신고 · 요청 · 신선도 · 설정은 11-19 에 지웠다. 어드민도 사용자 화면과 같은 스택(Tailwind · `ui/` 부품 · 디자인 토큰)으로 그린다. 전용 CSS 는 없다(11-19 에 지움). 공용 조각은 `components/admin/bits.tsx`(그리기) · `controls.tsx`(입력)이고, 글꼴만 다르다(어드민은 제목도 Pretendard). 접근은 `src/lib/admin/access.ts` 가 막는다(`ADMIN_KEY` 가 비면 개발 서버의 localhost 만, production 은 늘 잠김). 화면 내용은 `components/admin/AdminGate.tsx` 의 `AdminGate` 뒤에, 머리글의 단추·링크는 `AdminOnly` 뒤에 둔다.

**데이터 흐름 (한 방향).**
- 읽기: 화면은 `src/lib/data/index.ts` 로만 읽는다. 가려진 가게 걸러내기가 여기서 일어난다.
- 쓰기: route handler(`src/app/api/*`) → `src/lib/data/db.ts`. 규칙 검사와 쓰기가 지나가는 길은 이 파일 하나다. route handler 는 `src/lib/request.ts` 의 `readJson()`(다른 출처 403 · JSON 아님 415 · 64KB 초과 413)과 `whoFrom()`(기기 표시 `x-ddy-device` 없으면 400)을 먼저 지난다.
- 저장: `DATABASE_URL` 이 있으면 `pg.ts`(Postgres), 없으면 `.data/db.json` 파일이다. 저장 방식은 `db.ts` 안에서만 바꾼다. 화면 요청 하나에 저장소 읽기는 한 번이다(`db.ts` 의 `shared()`, `React.cache`).
- 사진: `src/lib/data/photos.ts` 가 둘 곳을 정한다. `SUPABASE_URL` · `SUPABASE_SERVICE_ROLE_KEY` 가 있으면 Supabase Storage 비공개 버킷(서버 경유), 없으면 서버 폴더(`.data/photos`), Vercel 에서 없으면 올리기를 거절한다.
- 표 설계: `db/init/*.sql` (표 13개, 새 DB 에서 차례로 돈다). Supabase 에는 SQL Editor 로 차례로 적용한다. 표가 바뀌면 `db/README.md` 「표가 바뀌면」을 따른다. 운영 데이터가 생긴 뒤에는 표를 지우고 다시 만들 수 없다.

**규칙·체계는 `lib/` 에 모은다.** 화면·서버·DB 가 함께 쓴다.
- `taxonomy.ts`: 태그 체계 (떡·스타일·맵기 등)
- `wiki.ts`: 등록·확인·숨김 기준과 하루 한도(한 사람 한도 + 같은 IP 상한)
- `community.ts`: 게시판·리스트 한도
- `filters.ts`: 주소 쿼리 ↔ 필터 (`?rice=…&style=…&spice=2-4`)

같은 사람 판정은 `db.ts` 에 있다. 「한 사람 한 번」은 기기 + IP, 내리는 판정(달라요 · 신고)은 서로 다른 IP 3곳, 하루 한도는 한 사람 한도 + 같은 IP 상한이고 지운 글·댓글·리스트도 센다. 내려간 가게는 맞아요·달라요 · 아직 있어요 · 평가를 받지 않는다.

단위 테스트는 이 규칙 함수들과 `db.ts` 쓰기 규칙 · `request.ts` · `photos.ts` · `admin.ts` · `admin/access.ts` 를 본다. React 부품은 E2E 로만 본다.

**지도.** MapLibre 6 + OpenFreeMap 타일을 쓰고, 대동여지도 느낌 바탕은 `components/map/dongyeoStyle.ts` 에 있다. `NEXT_PUBLIC_NAVER_MAP_KEY_ID` 가 있으면 네이버 지도를 쓴다(`realMap.ts`). MapLibre 일꾼 파일은 `public/maplibre/` 에 복사되며 깃에서 빠진다.

**색·디자인 토큰 2층.**
- 생성 층: `src/app/tokens.css`. `pnpm tokens` 로 만들고 **손으로 고치지 않는다**. 원본은 `docs/design-system/tokens.json` 이다.
- 연결 층: `src/app/globals.css`. shadcn·우리 변수를 Semantic 토큰에 잇는다.
- 규칙 문서는 `docs/design-system/` 에 있다. `src/lib/theme.ts` 는 지도 색 계산만 한다.
- 아이콘은 `lucide-react` 를 쓰고 기호 글자(＋ ✓ ♡)를 아이콘으로 쓰지 않는다. 글자 크기는 임의 값(`text-[13px]`)이 아니라 글자 토큰(`text-body-medium` 등)으로 쓴다. 클래스는 `@/lib/utils` 의 `cn` 으로 합친다. 대응표와 규칙은 컴포넌트 패턴 가이드 9장에 있다.
- `pnpm lint` 가 임의 글자 크기(`text-[13px]`) · 임의 색(`bg-[#…]`) · `ui/` 밖 날 `<button>` · `<input>` · `<select>` · `<textarea>` · 어드민의 CSS 가져오기와 `#hex` 를 막는다(`eslint.config.mjs`). 꼭 필요한 예외는 그 줄 위에 `eslint-disable-next-line no-restricted-syntax -- 까닭` 으로 까닭을 적는다.
- `ui/` 의 모든 파일은 `@/lib/utils` 의 `cn` 을 쓴다. shadcn 파일을 새로 받으면 `import { cn } from "cn"` 을 `@/lib/utils` 로 바꾼다(기본 `cn` 은 `text-heading-4` 같은 토큰 클래스를 조용히 떨어뜨린다).

**반응형 세 폭.** 폰 <768 은 지도 + 아래 시트 + 아래 메뉴, 768~1279 는 왼쪽 패널 + 지도, ≥1280 은 목록 + 상세 + 지도다. E2E 프로젝트도 이 세 폭(390·768·1280)이다.

## 알아 둘 것

- 키가 없어도 돈다. 저장소는 빈 채로 시작하고 저장은 `.data/` 파일에 된다. 예시 데이터는 앱에 없다(11-19 에 뺌). 시험만 `tests/fixtures/`(가게 16곳 · 글 · 리스트)로 저장소를 채워 돈다(`seed.ts` 의 `seedDataDir`). 환경 변수 설명은 `.env.example` 에 있다.
- `NEXT_PUBLIC_*` 값(`SITE_URL`, `NAVER_MAP_KEY_ID`)은 빌드 때 코드에 박힌다. 바꾸면 개발 서버를 다시 켠다.
- Vercel 에서는 `HASH_SALT` 나 `DATABASE_URL` 이 비어 있으면 서버가 시작하지 않는다. Supabase Storage 설정이 없으면 Vercel 에서는 사진 올리기를 거절한다(사진 없이 등록은 된다).
- production(`pnpm start` · Vercel)에서는 `ADMIN_KEY` 가 없으면 어드민이 늘 잠긴다. 개발 서버만 `ADMIN_KEY` 없이 127.0.0.1 · localhost 로 열린다.
- 접속 IP 는 `x-forwarded-for` 첫 주소다. Vercel 은 이 헤더를 덮어쓰지만, 프록시 없이 서버를 직접 열면 손님이 지어 보낼 수 있다(`src/lib/request.ts`).
- `globals.css` 를 고쳐도 개발 서버가 옛 CSS 를 줄 때가 있다. 다시 켜도 그대로면 개발 서버를 끄고 `.next/dev` 를 지운다(개발 캐시만 지우면 된다. `.next` 전체를 지우면 떠 있는 `pnpm start` 서버가 깨진다).
- 기기·IP 는 해시로만 남기고 화면에 내보내지 않는다(`db.ts` 의 `Mark`).

## 작업 방식

- **컴포넌트·페이지를 만들거나 고치기 전에 [`docs/guide/component-pattern.md`](docs/guide/component-pattern.md) 를 읽고 따른다.** 서버/클라이언트 경계, `<Suspense>`·`io()`, 컨테이너/View 계약, 쓸 수 있는 토큰 클래스, 안티패턴 표, 끝내기 전 체크리스트가 있다. 이 가이드와 `docs/design-system/` 이 다르면 디자인 시스템이 우선이다.
- 응답·주석·커밋 메시지·문서는 한국어로, 식별자는 영어로 쓴다. 들여쓰기는 2칸이다.
- 프로젝트 전용 에이전트가 `.claude/agents/` 에 있다. `dev/nextjs16-app-router-expert` 는 컨테이너·데이터·라우트를, `dev/ui-markup-specialist` 는 View 마크업만 맡는다. `prd-generator` 는 PRD 작성, `prd-validator` 는 PRD 검증, `roadmap-generator` 는 PRD 기준 로드맵 작성을 맡는다. git 슬래시 명령은 `.claude/commands/git/` 에 있다.
- 작업 기록은 `docs/작업기록.md` 에 남긴다. 기획 기준 문서는 README 「문서」 절에, 스택·저장·보안·배포의 지금 상태는 [`docs/개발/기술스택_v1_2026-10-28.md`](docs/개발/기술스택_v1_2026-10-28.md) 에 있다.
