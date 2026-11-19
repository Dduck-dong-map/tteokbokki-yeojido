# Development Guidelines

이 문서는 AI 에이전트가 이 저장소에서 작업할 때 따르는 규칙이다. 일반 개발 지식은 적지 않는다.
규칙의 원본은 `CLAUDE.md` · `docs/guide/component-pattern.md` · `docs/design-system/` 이고, 작업 순서의 원본은 `docs/ROADMAP.md` 다. 이 문서와 원본이 다르면 **원본이 우선**이고, 가이드와 디자인 시스템이 다르면 **디자인 시스템이 우선**이다.

## 1. 프로젝트 개요

- 떡볶여지도: 떡 종류·스타일·맵기로 찾는 떡볶이 맛집 지도. 가입 없이 누구나 올리고 고치며 「맞아요·달라요」로 거른다.
- 저장소 루트가 Next.js 앱 본체다. `web/` 폴더는 없다. 만들지 않는다.

| 항목 | 값 |
| --- | --- |
| 프레임워크 | Next.js 16.4 (App Router · `cacheComponents` · `partialPrefetching`), React Compiler 꺼짐 |
| 언어 · 스타일 | TypeScript · Tailwind CSS v4 · shadcn/ui (base-nova · `@base-ui/react`) |
| 패키지 관리 | **pnpm 만** (`pnpm@10.33.0`). `npm` · `yarn` 금지 |
| 저장 | `DATABASE_URL` 있으면 Postgres 16 + PostGIS(`pg.ts`), 없으면 `.data/db.json` |
| 사진 | Supabase Storage 비공개 버킷(설정 있을 때) / `.data/photos` |
| 지도 | MapLibre 6 + OpenFreeMap. `NEXT_PUBLIC_NAVER_MAP_KEY_ID` 있으면 네이버 지도 |
| 시험 | Vitest(`tests/unit`) · Playwright(`tests/e2e`, 폭 390 · 768 · 1280) |
| 배포 목표 | Vercel + Supabase |

## 2. 폴더 구조

| 위치 | 용도 |
| --- | --- |
| `src/app/(site)/` | 사용자 화면. `(site)/(map)/layout.tsx` 는 `/` 와 `/store/[id]` 가 함께 쓰는 지도 틀 |
| `src/app/admin/` | 운영 어드민. Server Action 은 `admin/actions.ts`, CSS 는 `.admin-root` 안에서만 |
| `src/app/api/*` | 사용자 쓰기 route handler (`stores` · `room` · `lists` · `photos` · `me`) |
| `src/components/ui/` | shadcn 파일 + 디자인 시스템 기본 부품(`chip` · `fab` · `snackbar` · `text-field`). 도메인을 모른다 |
| `src/components/brand/` | 고유 부품: `Logo` · `SpiceStamp` · `Chili` · `Stars` · `StoreThumb` · `PendingTag` · `Tag` |
| `src/components/layout/` | 쪽 틀: 헤더 · 아래 메뉴 · 격자(`grid.ts`) · 메뉴 목록(`nav.ts`) |
| `src/components/map/` | `TteokMap` · `dongyeoStyle.ts` · `realMap.ts` · `stamps.ts` |
| `src/components/<screen>/` | 한 화면의 컨테이너 · View · 계약(`types.ts`). `home` · `store` · `register` · `room` · `lists` · `mine` · `admin` · `loading` |
| `src/lib/` | 규칙·체계. `taxonomy.ts` · `wiki.ts` · `community.ts` · `filters.ts` · `freshness.ts` · `request.ts` · `me.ts` |
| `src/lib/data/` | `index.ts`(읽기 입구) · `db.ts`(쓰기·저장 방식) · `pg.ts` · `photos.ts` · `admin.ts` · `datasets.ts` |
| `src/lib/admin/access.ts` | 어드민 접근 판정 |
| `db/init/*.sql` | 표 설계 (표 13개, 번호 순서로 실행) |
| `docs/` | 기획 · 리서치 · 디자인 · 캐릭터 · 개발 · 공유 · `design-system/` · `guide/` · `PRD.md` · `ROADMAP.md` · `작업기록.md` |
| `scripts/` | `build-tokens.mjs` · `copy-maplibre-worker.mjs` · `copy-share.mjs` |

- 부품을 `src/app/` 안에 두지 않는다. 어드민 CSS(`src/app/admin/*.css`)만 예외다.
- 한 화면에서만 쓰는 부품은 `<screen>/` 에 둔다. 두 번째 화면이 쓰게 되면 `ui/`(도메인 없음)나 `brand/`(도메인 있음)로 옮긴다.

## 3. 작업 시작 전 필수

- **Next.js 코드를 쓰기 전에** `node_modules/next/dist/docs/` 의 해당 문서를 읽는다. 학습 지식의 Next.js API 를 그대로 쓰지 않는다.
- **컴포넌트·페이지를 만들거나 고치기 전에** `docs/guide/component-pattern.md` 를 읽는다. 끝내기 전에 15장 체크리스트를 확인한다.
- UI 를 고치기 전에 `docs/design-system/README.md` 와 해당 `components/` 문서를 읽는다.
- 요청받은 결과물에 필요한 일만 한다. 범위가 커지면 먼저 묻는다.

## 4. 로드맵 기준 작업 계획

작업 순서와 완료 기준의 원본은 `docs/ROADMAP.md`, 기능 정의와 수용 기준의 원본은 `docs/PRD.md` 다. 작업을 계획하거나 쪼갤 때(`plan_task` · `split_tasks`) 이 절을 따른다.

### 4.1 Phase 와 선행 조건

| Phase | 내용 | 대상 기능 | 먼저 끝나야 하는 것 |
| --- | --- | --- | --- |
| 1 | 프로젝트 초기 설정 (앱 골격 · 표 SQL · 시험 도구 · CI) | — | — |
| 2 | 공통 모듈/컴포넌트 (데이터 계층 · 규칙 모듈 · 쓰기 입구 · 사진 · 공용 부품 · 디자인 시스템 맞춤) | — | Phase 1 |
| 3 | 핵심 기능 (찾기 · 상세 · 등록 · 확인 · 신고 · 평가) | F001~F007 · F016~F021 | Phase 2 의 같은 사람 판정 · 하루 한도 |
| 4 | 추가 기능 (어드민 · 길찾기 누름 기록 · 찜 · 리스트 · 떡볶이방) | F010 · F012 · F015 · F022~F026 | Phase 3 의 가게 데이터 · 가게 상세 |
| 5 | 최적화 및 배포 (읽기 최적화 · Supabase · Vercel · 공개 출시 전 필수) | — | Phase 2~4 의 시험 통과 |

- 작업을 계획하기 전에 `docs/ROADMAP.md` 에서 그 작업이 속한 Phase 의 항목 · 「이유」 · 「완료 기준」을 읽는다.
- 기능 ID(F0NN)가 걸린 작업은 `docs/PRD.md` 의 그 기능 수용 기준(Given/When/Then)과 로드맵 「부록: 기능별 상태」의 메모를 읽는다.
- 앞 Phase 의 남은 일이 뒤 Phase 작업의 선행 조건이면 앞의 것을 먼저 작업으로 만든다.
- **Supabase · Vercel 연결(Phase 5)은 Phase 2~4 의 완료 기준이 끝나기 전에 하지 않는다.** 연결 뒤에는 `pnpm db:reset` 으로 표를 바꿀 수 없다.
- 작업 하나는 로드맵의 항목 하나(`- [ ]` 한 줄)에 대응시킨다. 작업 설명에 Phase 번호와 기능 ID 를 적는다.

### 4.2 로드맵의 상태를 그대로 믿지 않는다

- 로드맵의 `[ ]` · ✅ 와 숫자(표 개수 · 시험 개수 · 남은 곳 수)는 쓴 날의 값이다. **작업으로 만들기 전에 코드에서 지금 상태를 확인한다.**
- 확인 방법은 그 Phase 「완료 기준」의 명령을 그대로 쓴다. 예: `grep -rE "text-\[[0-9.]+px\]" src`, `pnpm test`, `pnpm e2e`.
- 이미 끝난 항목은 작업으로 만들지 않는다. 로드맵의 체크만 고치고 사용자에게 알린다.
- 로드맵과 `CLAUDE.md` · 코드가 다르면 코드가 사실이다.

### 4.3 완료 판정

| 로드맵 상태 | 뜻 | 「완료」로 올리려면 |
| --- | --- | --- |
| 통과 미확인 | 코드와 시험이 있고 E2E 통과를 확인하지 않음 | 메모에 적힌 E2E 를 돌려 통과 확인 |
| 시험 빠짐 | 수용 기준 일부 줄의 자동 시험이 없음 | 빠진 시험을 `tests/e2e/acceptance.spec.ts` 또는 `tests/unit/` 에 추가 |
| 일부 | PRD 와 코드가 다름 | 4.4 의 결정을 받은 뒤 PRD 또는 코드를 맞춤 |

- 작업의 검증 기준(`verify_task`)은 로드맵 「완료 기준」과 PRD 수용 기준에서 가져온다. 새로 지어내지 않는다.
- 수용 기준 한 줄마다 단위 시험 또는 E2E 가 하나 있어야 「완료」다.
- 손으로 확인해야 하는 기준(F007 폰 길찾기, 운영 주소 확인)은 자동 시험으로 대신하지 않는다. 확인 기록을 `docs/작업기록.md` 에 남기도록 사용자에게 넘긴다.
- Phase 2~4 를 고친 작업은 `pnpm typecheck` · `pnpm lint` · `pnpm test` 를 통과해야 한다. E2E 는 고친 기능의 것만 `-g` 로 돌린다.

### 4.4 결정이 필요한 것 · 범위 밖

- 로드맵 「결정이 필요한 것」 표에 있는 항목은 **스스로 정하지 않는다.** 선택지를 그대로 보여 주고 사용자의 결정을 받은 뒤 작업으로 만든다.
  - Phase 3 을 막는 것: F007 네이버 길찾기 링크, F018 맵기 변경 이력 형식
  - Phase 4 를 막는 것: F010 열쇠 없이 어드민을 열 때의 동작, 어드민 시안 메뉴
  - Phase 5 를 막는 것: 화면 범위 조회, 목록 페이지 캐시, 어드민 로그인 방식, 분석 도구, 배포 연결 방식 등
- PRD 와 코드가 다른 곳(「일부」)은 어느 쪽을 맞출지 결정이 나기 전에 코드도 PRD 도 고치지 않는다.
- 로드맵 「범위 밖」과 PRD 11절의 항목은 작업으로 만들지 않는다. 예: 「승인 후 공개」 스위치, 이용자 로그인, 포인트 · 순위, 맵기 투표, 주소 · 상호 검색.
- 이용약관 · 개인정보 처리방침, 권리 침해 요청 창구, Cloudflare Turnstile 은 Phase 5 「공개 출시 전」 항목이다. 그 전 Phase 의 작업에 섞지 않는다.

### 4.5 항목을 끝냈을 때

1. `docs/ROADMAP.md` 의 그 줄의 `[ ]` 를 ✅ 로 바꾼다.
2. 기능 ID 가 걸렸으면 「부록: 기능별 상태」 표의 상태 · 메모를 고친다.
3. 결정이 났으면 「결정이 필요한 것」 표에서 그 줄을 지우고 결정 내용을 해당 Phase 항목에 적는다.
4. `docs/작업기록.md` 에 기록한다.

- ❌ 로드맵에 날짜 · 담당자 추정을 더하기
- ❌ 수용 기준을 확인하지 않고 상태를 「완료」로 바꾸기
- ❌ 로드맵 전체를 다시 쓰기 (필요하면 `roadmap-generator` 에이전트에 맡긴다)

## 5. 코드 규칙

### 5.1 언어 · 형식

- 응답 · 주석 · 커밋 메시지 · 문서는 **한국어**, 식별자는 영어, 들여쓰기는 2칸.
- 주석은 "왜"를 적는다. 근거가 있으면 남긴다. 예: `// 11-08 사용자 지시`, `(REQ-W10)`.
- 경로는 별칭 `@/*`(→ `src/*`)를 쓴다.
- **새 파일은 같은 폴더의 기존 파일 형식을 따른다.**

| 폴더 | 파일 이름 | export | 세미콜론 |
| --- | --- | --- | --- |
| `src/components/ui/` | kebab-case (`text-field.tsx`) | `function X()` + 파일 끝 `export { X }` | 없음 |
| 화면 · `brand` · `layout` · `map` | PascalCase (`MapShell.tsx`) | `export default function X()` | 있음 |
| `app/**/page.tsx` · `layout.tsx` | Next 규칙 | default export | 있음 |

### 5.2 컨테이너 + View

- 화면은 `X.tsx`(컨테이너)와 `XView.tsx`(View)로 나눈다. 본보기: `components/home/MapShell.tsx` → `MapShellView.tsx`.
- props 계약은 `src/components/<screen>/types.ts` 에 둔다. 순서는 **데이터 → 상태 → 동작(onX) → 슬롯**.
- 컨테이너: 상태, `useSearchParams` · `useRouter`, 브라우저 API, `send()` 호출, 걸러내기·정렬.
- View: props 를 받아 그리기만 한다. 받은 `onX` 를 그대로 연결한다.
- ❌ View 에서 `useState` · `useRouter` · `fetch` · `localStorage` 사용
- ❌ View 에서 타입을 새로 정의 (계약은 `types.ts` 에서 import 만)
- 화면 문구(빈 상태·오류)는 컨테이너가 정해 넘긴다.

### 5.3 서버 · 데이터 읽기

- 비캐시 데이터 · `params` · `searchParams` · 현재 시각을 읽는 부분은 **`<Suspense>` 안**에 둔다. 페이지 파일 안에 `async function Loader()` 로 분리한다.
- `<Suspense>` 는 데이터를 읽는 부분만 감싼다. 아래 메뉴 등은 밖에 둔다. 본보기: `src/app/(site)/room/page.tsx`.
- 레이아웃에서 데이터를 읽으면 그 부분을 직접 `<Suspense>` 로 감싼다. 본보기: `(site)/(map)/layout.tsx`.
- `params` 는 `const { id } = await props.params` 로 읽는다.
- 화면 데이터에는 `"use cache"` 를 쓰지 않는다. `"use cache"` 는 `generateMetadata` 에만 있다.
- 요청 때 계산은 기존 코드처럼 `await connection()`, 새 코드에서 현재 시각만 재면 되는 경우는 `await io()`.
- 현재 시각은 서버가 `nowIso`(ISO 글자)로 넘긴다. 날짜 계산은 `lib/freshness.ts` 의 순수 함수에 둔다.
- ❌ `export const dynamic = "force-dynamic"` (없어진 설정)
- ❌ `useEffect` 로 첫 데이터 가져오기
- ❌ 클라이언트에서 `new Date()` 로 첫 렌더
- ❌ 서버 → 클라이언트 props 로 함수 · `Date` 넘기기

## 6. 데이터 흐름 (한 방향)

```
읽기: 화면(서버 컴포넌트) → @/lib/data (index.ts) → db.ts → pg.ts | .data/db.json
쓰기: 컨테이너 → send() (@/lib/me) → /api/* → readJson() → whoFrom() → check*() → db.ts → reply()
어드민: 화면 → Server Action (admin/actions.ts) → allowed() → lib/data/admin.ts
```

- 화면은 **`@/lib/data` 로만** 읽는다. 예시 데이터 숨김과 가려진 가게 걸러내기는 여기서만 한다.
- 저장 방식 분기(Postgres ↔ 파일)는 **`db.ts` 안에서만** 한다.
- 읽기 함수가 돌려준 배열·객체를 고치지 않는다. `filter` · `map` 으로 새 값을 만든다. (요청 하나에 저장소 읽기는 한 번이고 여러 곳이 값을 함께 쓴다.)
- 컴포넌트에서 `React.cache` 를 따로 감싸지 않는다.
- 사용자 화면의 쓰기는 `send(url, body)`, 사진은 `uploadPhoto()` 로만 보낸다.
- 쓰기 뒤 화면 갱신은 `router.refresh()`. 실패는 throw 하지 않고 `res.error` 문구를 그대로 표시한다.

### 6.1 새 쓰기 route handler 형식

```ts
import { bad, readJson, reply, whoFrom } from "@/lib/request";

export async function POST(req: Request) {
  const body = await readJson(req);
  if (body instanceof Response) return body;
  const who = whoFrom(req, body.nick);
  if (who instanceof Response) return who;
  // 입력 검사(check*) → 실패면 bad(error, 422)
  return reply(await addSomething(input, who), 201);
}
```

- ❌ route handler 에서 `req.json()` 을 바로 읽기
- ❌ 컴포넌트에서 `fetch` 로 직접 POST
- ❌ 화면에서 `db.ts` · `pg.ts` · `.data/` 를 직접 읽기

### 6.2 규칙 함수의 자리

| 규칙 | 파일 |
| --- | --- |
| 태그 체계 (떡 · 스타일 · 맵기) | `src/lib/taxonomy.ts` |
| 등록 · 확인 · 숨김 기준, 하루 한도 | `src/lib/wiki.ts` |
| 게시판 · 리스트 한도 | `src/lib/community.ts` |
| 주소 쿼리 ↔ 필터 | `src/lib/filters.ts` |
| 같은 사람 판정 (기기 + IP, 서로 다른 IP 3곳) | `src/lib/data/db.ts` |

- 한도 · 반경 · 숨김 기준을 컴포넌트에서 다시 구현하지 않는다. 화면 안내용 미리 보기만 허용한다.
- 내려간 가게(`hidden` · `closed`)는 맞아요·달라요 · 아직 있어요 · 평가를 받지 않는다(409). 화면은 그 칸을 그리지 않는다.
- 기기 · IP 는 해시로만 남기고 화면에 내보내지 않는다.

### 6.3 어드민

- Server Action 은 **함수마다** `allowed()` 로 권한을 확인한다.
- 화면 내용은 `<AdminGate>`, 머리글의 단추·링크는 `<AdminOnly>` 로 감싼다. 제목·설명은 밖에 둔다. 시안 화면도 같다.
- 레이아웃에서 권한을 막지 않는다. 화면마다 확인한다.
- 예상할 수 있는 실패는 `{ ok: false, error }` 로 돌려준다.

## 7. 디자인 시스템

- 색 · 글자 · 그림자 · 치수 클래스는 `docs/guide/component-pattern.md` 9.3절 표에 있는 이름만 쓴다. **Tailwind 는 `@theme` 에 없는 이름을 경고 없이 무시한다.** 없는 이름이 필요하면 `globals.css` 의 `@theme inline` 에 먼저 잇는다.
- 글자 크기는 글자 토큰 유틸(`text-body-medium` · `text-heading-3` 등)로 쓴다. `leading-*` 을 따로 주지 않는다.
- 아이콘은 `lucide-react`. 크기는 `size-icon-md` · `size-icon-sm`. 장식 아이콘은 `aria-hidden="true"`, 아이콘만 있는 버튼은 `aria-label`.
- 클래스는 `import { cn } from "@/lib/utils"` 로 합친다.
- 버튼 · 칩 · 입력칸은 `ui/` 의 `Button`(`filled` · `tonal` · `outlined` · `text`) · `Chip` · `TextField` · `TextAreaField` 를 쓴다.
- 옥빛(`bg-primary`)은 화면마다 주 행동 **하나**에만. 두 번째 행동은 `bg-secondary`, 제보·등록은 `bg-report`.
- 뜻을 담는 경계(입력칸 · 칩 · 외곽선 버튼)는 `border-input`, 장식 구분선은 `border-border`.
- 제목(`h1`~`h3`)은 조선100년체이고 굵기가 하나다. 조선100년체는 16px 이상에만 쓴다.
- 상태는 색 + 글자/아이콘으로 표시한다. 맵기는 `brand/SpiceStamp`, 확인 중은 `brand/PendingTag`.
- 누르는 영역은 48px (`.hit-target`).
- 말투는 해요체, 버튼은 동사로 끝낸다. 오류 문구에 이모지를 쓰지 않는다.

| ❌ 금지 | ✅ 대신 |
| --- | --- |
| `text-[13px]` · `text-[0.8rem]` | `text-body-small` 등 글자 토큰 |
| `bg-red-500` · `#RRGGBB` · `bg-[#…]` | 시맨틱 토큰 클래스 |
| 기호 글자 ＋ ✓ ♡ 를 아이콘으로 | `Plus` · `Check` · `Heart` |
| `import { cn } from "cn"` (새 파일) | `@/lib/utils` |
| 제목에 `font-bold` | 크기 · 색 · 자간 |
| 템플릿 문자열로 클래스 합치기 | `cn()` |
| 맵기 도장 · 별점 · 로고 다시 그리기 | `brand/` 부품 |
| 오류 빨강과 맵기 빨강을 서로 대신 쓰기 | `text-destructive` / `chart-*` · `spicy*` 구분 |

## 8. 함께 고쳐야 하는 파일

| 고치는 것 | 함께 할 일 |
| --- | --- |
| 디자인 토큰 값 | `docs/design-system/tokens.json` 을 고치고 `pnpm tokens` 실행. **`src/app/tokens.css` 는 손으로 고치지 않는다** |
| 새 토큰 유틸 이름 | `src/app/globals.css` 의 `@theme inline` 에 잇고, `src/lib/utils.ts` 의 `cn` 등록과 가이드 9.3절 표를 맞춘다 |
| View 의 props | `src/components/<screen>/types.ts` → 컨테이너 → View 순서로 함께 고친다 |
| 표(`db/init/*.sql`) | `src/lib/data/pg.ts` · `db.ts` · `src/lib/types.ts` · `tests/unit/pg.test.ts` · `db/README.md` 를 맞추고 `pnpm db:reset`. CLAUDE.md 의 표 개수도 확인 |
| 규칙 함수(`wiki.ts` · `community.ts` · `db.ts` 쓰기 규칙) | `tests/unit/` 의 해당 시험을 고치고 `pnpm test`. 수용 기준이 바뀌면 `docs/PRD.md` · `tests/e2e/acceptance.spec.ts` |
| `src/lib/request.ts` | `tests/unit/request.test.ts` |
| `src/lib/data/photos.ts` | `tests/unit/photos.test.ts` |
| `src/lib/admin/access.ts` · `lib/data/admin.ts` | `tests/unit/access.test.ts` · `admin.test.ts` |
| 태그 체계(`taxonomy.ts`) | `filters.ts` · `tests/unit/filters.test.ts` · 필터 화면 |
| 새 라우트 | `tests/e2e/routes.spec.ts` 에 추가 |
| 환경 변수 추가 | `.env.example` · `docs/개발/기술스택_v1_2026-10-28.md` |
| 스택 · 저장 · 보안 · 배포 상태 변경 | `docs/개발/기술스택_v1_2026-10-28.md` · `CLAUDE.md` |
| `docs/공유/` 의 공유 HTML | `scripts/copy-share.mjs` 의 경로 확인 (`public/share/` 는 복사본이라 직접 고치지 않는다) |
| shadcn 파일 다시 받기 | `pnpm exec shadcn add <name>` 전에 `git diff` 로 우리가 고친 줄 확인. 고친 파일: `button` · `badge` · `input` · `textarea` |
| 로드맵 항목을 끝냄 | `docs/ROADMAP.md` 의 체크 · 「부록: 기능별 상태」 (4.5절) |
| PRD 의 기능 · 수용 기준 변경 | `docs/ROADMAP.md` 의 대상 기능 · 완료 기준 · 부록, `tests/e2e/acceptance.spec.ts` |
| 표 개수 · 라우트 개수 · 시험 개수 변경 | `docs/ROADMAP.md` 의 해당 숫자 |
| 작업을 마쳤을 때 | `docs/작업기록.md` 에 기록 |

- 기획안 · 시안은 덮어쓰지 않는다. v1, v2 로 새 파일을 둔다.

## 9. 확인 명령

| 고친 것 | 실행 |
| --- | --- |
| 모든 코드 변경 | `pnpm typecheck` · `pnpm lint` |
| `lib/` 규칙 · `db.ts` · `request.ts` · `photos.ts` · `admin.ts` | `pnpm test` |
| 화면 · 흐름 | `pnpm exec playwright test --project=mobile-390 -g "이름"` (필요하면 `tablet-768` · `desktop-1280`) |
| 하나만 | `pnpm exec vitest run tests/unit/wiki.test.ts -t "이름"` |

- E2E 는 3101 포트에 파일 저장소 모드(`DATA_DIR=.data-e2e`)로 따로 뜬다. 개발 DB 를 건드리지 않는다.
- E2E 선택자는 `getByRole` 을 쓴다. `.locator()` 만 쓰면 숨은 화면까지 잡힌다. 필요하면 `.filter({ visible: true })`.
- React 부품의 단위 시험은 만들지 않는다. 부품은 E2E 로만 본다.
- `NEXT_PUBLIC_*` 값을 바꾸면 개발 서버를 다시 켠다.
- `globals.css` 를 고쳤는데 옛 CSS 가 나오면 개발 서버를 다시 켜고, 그래도 같으면 `.next` 를 지운다.
- 긴 검증(전체 E2E 세 폭)은 꼭 필요할 때 한 번만 돌린다.

## 10. Git

- 커밋 형식: `<이모지> <타입>: <설명>` 또는 `<이모지> <타입>(범위): <설명>`. 한국어, 명령형, 첫 줄 72자 미만. 이모지 표는 `.claude/commands/git/commit.md`.
- 제목만 읽고 무엇이 바뀌었는지 알 수 있게 쓴다. 필요 없는 본문을 붙이지 않는다.
- **커밋에 Claude 서명(`Co-Authored-By` 등)을 넣지 않는다.**
- 커밋은 사용자가 요청할 때만 한다. 작업마다 쪼개지 않고 큰 묶음 1~2개로 만든다.
- `git add` 는 경로를 명시한다. `git add -A` · `git add .` 금지 (다른 에이전트의 변경이 섞인다).
- 푸시는 요청받았을 때만 한다.

## 11. AI 판단 기준

### 11.1 누가 맡는가

| 작업 | 에이전트 |
| --- | --- |
| 컨테이너 · 데이터 · 라우트 · route handler · Server Action | `nextjs16-app-router-expert` |
| `XView.tsx` 정적 마크업 · 스타일 | `ui-markup-specialist` |
| PRD 작성 / 검증 | `prd-generator` / `prd-validator` |
| 로드맵 | `roadmap-generator` |

- 화면 하나를 새로 만들면 `types.ts` 계약을 먼저 정하고 컨테이너와 View 를 나눠 맡긴다.

### 11.2 새 코드를 어디에 두는가

```
도메인(떡 · 가게)을 아는가?
├─ 모른다 → src/components/ui/
└─ 안다
   ├─ 두 화면 이상이 쓴다 → src/components/brand/
   ├─ 쪽 틀이다 → src/components/layout/
   └─ 한 화면만 쓴다 → src/components/<screen>/

로직인가?
├─ 화면 · 서버 · DB 가 함께 쓰는 규칙 → src/lib/*.ts
├─ 저장소를 읽는다 → src/lib/data/index.ts 에 읽기 함수 추가
└─ 저장소에 쓴다 → src/lib/data/db.ts 에 쓰기 함수 + src/app/api/* route handler
```

### 11.3 우선순위

1. 사용자의 이번 지시
2. `docs/design-system/`
3. `docs/guide/component-pattern.md`
4. `CLAUDE.md` · 이 문서
5. 같은 폴더 기존 파일의 방식

- 무엇을 만드는가는 `docs/PRD.md`, 어떤 순서로 하는가는 `docs/ROADMAP.md`, 어떻게 쓰는가는 위 2~5 가 정한다.

- 디자인 시스템에 정해진 것은 묻지 않고 그대로 따른다.
- 문서와 코드가 다르면 코드를 사실로 보고, 문서를 고칠지 사용자에게 알린다.
- 기획에 없는 기능 · 문구를 지어내지 않는다. `docs/PRD.md` 의 기능 ID 와 수용 기준을 기준으로 한다.

## 12. 금지 사항

- ❌ `src/app/tokens.css` 손으로 고치기
- ❌ `AGENTS.md` 손으로 고치기 (`next dev` 가 다시 만든다)
- ❌ `npm` · `yarn` 사용
- ❌ `public/maplibre/` · `public/share/` 직접 고치기 (복사본, 깃 제외)
- ❌ `.data/` · `.data-e2e/` · `.shrimp/` · `.env*` 커밋 (`.env.example` 만 올린다)
- ❌ Supabase 연결 뒤 `pnpm db:reset` 으로 표 바꾸기
- ❌ 기기 · IP 해시를 화면이나 응답에 내보내기
- ❌ 쓰기 입구(`readJson()` · `whoFrom()`)를 건너뛰는 route handler
- ❌ 권한 확인 없는 Server Action, `AdminGate` 밖의 어드민 내용
- ❌ 화면에서 저장소 직접 읽기, 컴포넌트에서 규칙 다시 구현하기
- ❌ `export const dynamic = "force-dynamic"`
- ❌ 임의 글자 크기 · 하드코딩 색 · 기호 글자 아이콘
- ❌ 측정 없이 `memo` · `useCallback` 추가 (비싼 계산 · 지도 콜백에만)
- ❌ 기획안 · 시안 파일 덮어쓰기
- ❌ 요청받지 않은 커밋 · 푸시 · 범위 확장
- ❌ 로드맵 「결정이 필요한 것」을 스스로 정하기, 「범위 밖」 항목 구현하기
- ❌ Phase 2~4 완료 기준이 끝나기 전에 운영 DB(Supabase) 연결하기
