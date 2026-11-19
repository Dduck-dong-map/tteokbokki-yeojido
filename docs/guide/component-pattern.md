# 컴포넌트 패턴 가이드

이 문서는 떡볶여지도에서 컴포넌트를 쓰는 방법을 정리한다.

- **기준 버전**: 설치된 **Next.js 16.4.6 · React 19.3.0**(`package.json`). 프레임워크 규칙은 번들 문서 `node_modules/next/dist/docs/01-app/` 를 따르고, 각 절에 파일 이름을 `(문서: 파일.md)` 로 적었다. 버전을 올리면 이 문서도 다시 확인한다.
- **함께 보는 문서**:
  - 색·글자·간격·누르는 영역: [`docs/design-system/README.md`](../design-system/README.md) · [`accessibility.md`](../design-system/accessibility.md)
  - 부품 명세: [`docs/design-system/components/`](../design-system/components/)
  - 저장소 구조: 루트 [`CLAUDE.md`](../../CLAUDE.md)
  - 스택·저장·보안: [`docs/개발/기술스택_v1_2026-10-28.md`](../개발/기술스택_v1_2026-10-28.md)
- **우선순위**: 이 문서와 위 문서가 다르면 위 문서가 우선이다.
- [`Nextjs-16.4.2.md`](Nextjs-16.4.2.md) 의 0절·15절(Payload, 루트 레이아웃 두 개)은 다른 프로젝트 설정이라 이 저장소에 적용하지 않는다.

---

## 0. 이 프로젝트에서 먼저 알아야 할 것

| 항목 | 현재 상태 | 컴포넌트 작성에 미치는 영향 |
| --- | --- | --- |
| `cacheComponents` | 켜짐 (`next.config.ts`) | 비캐시 데이터·현재 시각은 `<Suspense>` 안에서만 읽는다(4장) |
| `partialPrefetching` | 켜짐 (`next.config.ts`) | `<Link>` 프리페치가 경로의 정적 셸까지 미리 받는다. 셸이 클수록 이득 |
| React Compiler | 꺼짐 (`reactCompiler` 설정 없음) | 자동 메모이제이션 없음(8.1절) |
| 화면 구조 | **컨테이너 + View** | 상태는 `X.tsx`, 그리기는 `XView.tsx`(2장) |
| 데이터 읽기 | `@/lib/data` 만. 화면 요청 하나에 저장소 읽기는 한 번(`db.ts` 의 `shared()`, `React.cache`) | 화면에서 `db.ts`·`pg.ts`·`.data/` 를 직접 읽지 않는다(4.6·4.7절) |
| 데이터 쓰기 | 사용자 화면은 `send()`(`@/lib/me`) → `/api/*` → `readJson()`·`whoFrom()`(`@/lib/request`) → `db.ts`. 어드민은 Server Action(`src/app/admin/actions.ts`) | 쓰기는 `send()` 로만 보낸다. 기기 표시(`x-ddy-device`)가 없는 쓰기는 400이다(6장) |
| 부품 | `@/components/ui/*`(shadcn base-nova · `@base-ui/react`). 보정 래퍼 폴더는 없다 | 디자인 시스템 부품(Chip · Fab · Snackbar · TextField · TextAreaField)은 `ui/` 에 우리가 만든 파일로 둔다. `button` 에는 디자인 시스템 종류(`filled` · `tonal` · `outlined` · `text`)와 크기가, `input` · `textarea` 에는 `variant="field"` 가 더해져 있다(9.3절) |
| 클래스 합치기 | `@/lib/utils` 의 `cn`(`createCn` 으로 우리 토큰 이름을 등록) | 새 파일은 `"cn"` 패키지가 아니라 `@/lib/utils` 에서 가져온다(9.4절) |
| 아이콘 | `lucide-react`(`components.json` 의 `iconLibrary`). 어드민도 같다(`components/admin/Icon.tsx`) | 기호 글자(＋ ✓ ♡)를 아이콘으로 쓰지 않는다(9.7절) |
| 글자 크기 | 글자 토큰 유틸(`text-body-medium` 등) | 임의 크기 `text-[Npx]` 를 쓰지 않는다(9.8절) |
| 어드민 화면 | 내용은 `AdminGate`, 머리글의 단추·링크는 `AdminOnly` 뒤(`components/admin/AdminGate.tsx`). 사용자 화면과 같은 스택으로 그린다 — 전용 CSS 는 없고 공용 조각은 `components/admin/bits.tsx`(그리기) · `controls.tsx`(입력) | 권한은 화면과 Server Action마다 확인한다(6.2절). 제목 글꼴만 다르다: 어드민은 `h1`~`h3` 도 Pretendard(`app/admin/layout.tsx`) |
| 린트 | `pnpm lint` 가 디자인 시스템 금지 규칙을 본다(`eslint.config.mjs`) | 임의 글자 크기 · 임의 색 · `ui/` 밖 날 입력 요소 · 어드민 CSS 가 오류다. 예외는 그 줄에 까닭을 적는다(14장) |
| 지도 | MapLibre 6, 브라우저에서만 | `TteokMap` 이 effect 안에서 `import("maplibre-gl")` 로 불러온다(8.2절) |

---

## 1. 파일 작성 규칙

### 1.1 선언과 export: 폴더마다 다르다

| 폴더 | 파일 이름 | export | 따옴표 · 세미콜론 |
| --- | --- | --- | --- |
| `src/components/ui/` | kebab-case (`text-field.tsx`) | `function X()` + **파일 끝** `export { X, xVariants }` | 쌍따옴표 · 세미콜론 **없음** (shadcn 생성 형식) |
| 화면·brand·layout·map | PascalCase (`MapShell.tsx`, `StoreRowView.tsx`) | `export default function X()` | 쌍따옴표 · 세미콜론 **있음** |
| 묶음 내보내기 | `brand/index.ts` · `layout/index.ts` | `export { default as Logo } from "./Logo"` 식 | 같은 폴더를 따른다 |
| `app/**/page.tsx` · `layout.tsx` | Next 규칙 | **default export 필수** | 세미콜론 있음 |

- **새 파일은 같은 폴더의 기존 파일을 따른다.**
- 경로는 별칭 `@/*`(→ `src/*`)를 쓴다.
- 주석은 한국어로 "왜"를 적는다. 근거(기획 문서 절 번호, 날짜, 대비 수치)가 있으면 남긴다. 예: `// 11-08 사용자 지시`, `(REQ-W10)`.

```tsx
// src/components/ui/ 형식
import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

function SectionTitle({ className, ...props }: ComponentProps<"h2">) {
  return <h2 className={cn("text-heading-3", className)} {...props} />
}

export { SectionTitle }
```

### 1.2 폴더

| 위치 | 용도 |
| --- | --- |
| `src/components/ui/` | shadcn 파일(`button` · `badge` · `input` · `textarea` · `sheet` · `dialog` · `tabs` · `select` …)과 디자인 시스템 기본 부품(`chip` · `fab` · `snackbar` · `text-field`). 도메인(떡·가게)을 모른다 |
| `src/components/brand/` | 떡볶여지도 고유 부품: `Logo` · `SpiceStamp` · `Chili` · `Stars` · `StoreThumb` · `PendingTag` · `SampleRibbon` · `Tag` |
| `src/components/layout/` | 쪽 틀: `SiteHeaderView` · `BottomNav` · `BackHeader` · `SearchBoxView` · 격자(`grid.ts`) · 메뉴 목록(`nav.ts`) |
| `src/components/map/` | 지도(`TteokMap`), 대동여지도 바탕(`dongyeoStyle.ts`), 네이버 지도(`realMap.ts`), 지도 도장(`stamps.ts`) |
| `src/components/<screen>/` | 한 화면의 컨테이너 · View · 계약(`types.ts`). `home` · `store` · `register` · `room` · `lists` · `mine` · `admin` · `loading` |

- `src/components/ui/` 의 shadcn 파일을 다시 받으려면 설치된 CLI 로 `pnpm exec shadcn add <name>` 을 쓴다. **덮어쓰기 전에** 우리가 고친 줄이 있는지 `git diff` 로 확인한다.
  - `ui/` 의 모든 파일은 `@/lib/utils` 의 `cn` 을 쓴다(11-19). 새로 받은 파일은 `import { cn } from "cn"` 을 `@/lib/utils` 로 바꾼다. `sonner` 는 `cn` 을 쓰지 않는다.
  - 우리가 고친 shadcn 파일: `button`(디자인 시스템 종류 · 크기) · `badge` · `input` · `textarea`(`variant="field"`) · `dialog` · `sheet`(가림막 `bg-scrim` · 「닫기」) · `tabs`(줄 탭의 켜진 탭 = 옥빛).
  - import 만 바꾼 shadcn 파일: `card` · `checkbox` · `label` · `radio-group` · `select` · `separator` · `skeleton` · `switch` · `table`.
- 어드민 부품은 `src/components/admin/` 에 있다. 아이콘은 `Icon.tsx`(lucide), 잠금은 `AdminGate.tsx`, 공용 조각은 `bits.tsx`(`PageHeader` · `Panel` · `TableFrame` · `StatusBadge` · `Notice` · `Field` · `Empty` · `Stat` 등, 서버 컴포넌트에서도 쓴다)와 `controls.tsx`(`PickSelect` · `SearchInput` · `CheckField` · `RadioList` · `SwitchField` · `Toast`, `"use client"`)다. 어드민 화면은 이 조각과 `ui/` 부품으로만 그린다.
- 한 화면에서만 쓰는 부품은 `<screen>/` 에 둔다. 두 번째 화면에서 쓰이게 되면 그때 `ui/`(도메인 없음)나 `brand/`(도메인 있음)로 옮긴다.
- `app/` 안의 파일은 `page`·`route` 가 아니면 공개되지 않지만, 이 저장소는 부품을 `app/` 안에 두지 않는다. CSS 도 전역 `globals.css` · `tokens.css` 뿐이다(어드민 전용 CSS 는 11-19 에 지웠다).

---

## 2. 컨테이너와 View (이 저장소의 핵심 패턴)

화면마다 **컨테이너**(`X.tsx`)와 **View**(`XView.tsx`)로 나눈다. 본보기: `components/home/MapShell.tsx` → `MapShellView.tsx`, 계약 `components/home/types.ts`.

| | 컨테이너 `X.tsx` | View `XView.tsx` |
| --- | --- | --- |
| 하는 일 | 상태, 주소(`useSearchParams`·`usePathname`·`useRouter`), 브라우저 API(`geolocation`·`matchMedia`·`history`·`localStorage`), `send()` 호출, 걸러내기·정렬 계산 | props 를 받아 그리기만 한다 |
| `"use client"` | 보통 붙는다 | shadcn 부품이 요구할 때만(Sheet · Dialog · Tabs · Select) |
| 핸들러 | 본문을 구현한다 | 받은 `onX` 를 **그대로 연결만** 한다(`onClick={onSelect}`) |
| 맡는 에이전트 | `nextjs16-app-router-expert` | `ui-markup-specialist` |

### 2.1 계약 파일 `types.ts`

```ts
// src/components/<screen>/types.ts
// 이 View 가 그리는 것: …
// 컨테이너가 넘기는 것: …
// 넘기지 않는 것: router · searchParams · pathname · window.history · geolocation · matchMedia 읽기 — 전부 컨테이너 안에서 끝낸다.
export type XViewProps = {
  // 데이터
  stores: Store[];
  // 상태
  selectedId: string | null;
  sheet: SheetState;
  // 동작
  onSelect: (id: string) => void;
  onSheetChange: (s: SheetState) => void;
  // 슬롯
  children?: ReactNode;
};
```

- 순서는 **데이터 → 상태 → 동작(onX) → 슬롯**이다.
- 계약은 컨테이너가 소유하고 View 는 import 만 한다. View 쪽에서 타입을 새로 만들지 않는다.
- 문구(빈 상태·오류)는 컨테이너가 정해서 넘긴다. 화면 문구는 기획 문서에 있는 그대로 쓴다.

### 2.2 페이지 → 컨테이너

페이지(서버 컴포넌트)는 `@/lib/data` 로 읽어 **값**을 컨테이너에 넘긴다. 컨테이너는 그 값으로 상태를 만든다.

```tsx
// src/app/(site)/room/page.tsx (실제 코드 줄임)
export default function RoomPage() {
  return (
    <Suspense fallback={<div className="flex-1" />}>
      <Loader />
    </Suspense>
  );
}

async function Loader() {
  await connection(); // 새 글이 바로 보여야 한다
  const [posts, stores] = await Promise.all([getPosts(), getStores()]);
  // 현재 시각은 서버에서 ISO 글자로 만들어 넘긴다 — 클라이언트에서 new Date() 로 다시 재면 서버 HTML 과 달라진다
  return <RoomBoard posts={posts} storeNames={names} nowIso={new Date().toISOString()} />;
}
```

---

## 3. 서버 컴포넌트와 클라이언트 컴포넌트

(문서: `01-getting-started/05-server-and-client-components.md` · `02-guides/server-and-client-boundary.md`)

### 3.1 기본은 서버 컴포넌트

`"use client"` 가 없으면 서버 컴포넌트다. 데이터 조회와 정적 표시는 서버에서 한다. 아래가 필요할 때만 `"use client"` 를 붙인다.

- 상태와 이벤트 핸들러(`useState`, `onClick`)
- `useEffect`, `useLayoutEffect`, `useSyncExternalStore`
- 브라우저 API(`window`, `localStorage`, `navigator.geolocation`)
- 클라이언트 훅(`usePathname`, `useSearchParams`, `useRouter`, `useLinkStatus`)

**기기 저장값(`localStorage`)은 `useSyncExternalStore` 로 읽는다.** 서버 스냅샷은 빈 값으로 둔다. 본보기는 `lib/me.ts` 의 `useMe`, `lib/mine.ts`, `RegisterForm` 의 임시 저장이다. 이렇게 하면 서버 HTML 과 첫 브라우저 렌더가 어긋나지 않는다.

첫 브라우저 렌더가 서버 HTML 과 **달라야만** 하는 부품은 `use(browser())`(React 19.3)를 `<Suspense>` 안에서 쓴다. 이때 fallback 이 프리렌더 HTML 이 되므로, 검색엔진에 보여야 할 내용은 그 밖에 둔다(문서: `02-guides/single-page-applications.md`).

### 3.2 경계는 작게

- `"use client"` 는 **파일 맨 위, import 보다 위**에 둔다.
- 그 파일이 import 하는 모듈은 모두 클라이언트 번들에 들어간다. 하위 파일마다 다시 붙일 필요는 없다.
- 레이아웃 전체를 클라이언트로 만들지 않는다. 예를 들어 `(site)/layout.tsx` 는 서버에 두고, 활성 메뉴 표시처럼 상호작용하는 부분만 클라이언트로 나눈다.

### 3.3 서버 컴포넌트를 클라이언트 컴포넌트 안에 넣기

`children` 등 prop 으로 넘긴 서버 컴포넌트는 렌더 결과만 넘어간다. 본보기는 `(map)/layout.tsx` 다. 지도 홈 컨테이너 `MapShell`(클라이언트)이 가게 상세(서버에서 읽은 `children`)를 슬롯으로 받는다.

### 3.4 props 는 직렬화할 수 있어야 한다

서버에서 클라이언트로 넘기는 props 에 **함수, 클래스 인스턴스, `Date`, Symbol** 을 넣지 않는다. `Date` 는 ISO 글자로 바꿔 넘긴다(`nowIso`). 예외는 Server Action(`"use server"` 함수)이다.

```tsx
// ❌ 서버 컴포넌트에서 일반 함수를 넘김
<StoreRow onPick={() => log()} />

// ✅ 값만 넘기고, 동작은 클라이언트 컨테이너 안에서 정한다
<StoreList stores={stores} />
```

### 3.5 Context Provider

- 서버 컴포넌트는 Context 를 쓸 수 없다. Provider 는 클라이언트 컴포넌트로 만들고 `children` 을 받는다.
- Provider 는 **가능한 깊은 곳**에서 감싼다. `<html>` 전체를 감싸지 않는다. 예외는 `next-themes`·`sonner` 처럼 앱 전체에 걸리는 것이다.

### 3.6 서버 전용 코드

- `src/lib/data/db.ts` · `pg.ts` · `admin.ts` 와 `src/lib/admin/access.ts` 는 서버 전용이다. `node:fs`·`node:crypto`·`postgres`·`next/headers` 를 쓴다.
  - 클라이언트 컴포넌트는 이 파일들과 `@/lib/data` 를 import 하지 않는다.
  - 클라이언트가 쓸 수 있는 공통 규칙(`taxonomy` · `wiki` · `community` · `filters` · `types`)은 서버 전용 모듈을 import 하지 않게 유지한다.
- 클라이언트 코드에서는 `NEXT_PUBLIC_` 로 시작하는 환경 변수만 읽는다. `DATABASE_URL`·`HASH_SALT`·`ADMIN_KEY` 는 서버에서만 쓴다.

### 3.7 서드파티 부품

`"use client"` 가 없는데 상태를 쓰는 라이브러리 부품은 클라이언트 래퍼 파일에서 다시 export 해서 쓴다. shadcn base-nova 부품은 이미 `"use client"` 가 필요한 곳에 붙어 있다.

---

## 4. 데이터를 읽는 컴포넌트 (Cache Components)

(문서: `01-getting-started/08-caching.md` · `03-api-reference/04-functions/io.md` · `connection.md` · `03-api-reference/01-directives/use-cache.md`)

### 4.1 핵심 규칙

비캐시 데이터나 런타임 API(`cookies()`, `headers()`, `searchParams`, `params`)를 읽는 컴포넌트는 **둘 중 하나**여야 한다. 아니면 개발 오버레이에 blocking-route 경고가 뜨고 빌드가 막힌다.

1. `"use cache"` 로 캐시한다 → 정적 셸에 들어간다.
2. `<Suspense>` 로 감싼다 → fallback 이 정적 셸에 들어가고, 내용은 요청 때 스트리밍된다.

**이 저장소의 화면 데이터는 2번만 쓴다.** 가게·글은 누가 고치면 바로 나와야 해서 `@/lib/data` 의 읽기 함수에 `"use cache"` 가 없다. `"use cache"` 는 `generateMetadata` 다섯 곳(`/store/[id]` · `/room/[id]` · `/lists/[id]` · `/seoul/[gu]` · `/seoul/[gu]/[taste]`)에만 있다.

### 4.2 `<Suspense>` 는 데이터 가까이에

페이지 전체가 아니라 **데이터를 읽는 부분만** 감싼다. 나머지(아래 메뉴 등)는 정적 셸로 바로 나온다. `room/page.tsx` 의 `BottomNav` 는 `<Suspense>` 밖에 있다.

페이지·레이아웃 파일은 default export 가 필요하다. 그 안의 데이터 부분은 같은 파일의 `async function Loader()` 로 둔다.

### 4.3 레이아웃에서 데이터를 읽을 때

`loading.tsx` 는 레이아웃 **아래**에 있어서 레이아웃 자체의 대기를 감싸 주지 못한다. 레이아웃에서 데이터를 읽으면 그 부분을 직접 `<Suspense>` 로 감싼다. 본보기는 `(map)/layout.tsx` 다. fallback 으로 `IntroZoom still`(첫 장면)을 세워 두고, 데이터를 받으면 지도로 넘어간다.

### 4.4 요청 때 계산하기: `io()` 와 `connection()`

| | `await io()` (`next/cache`) | `await connection()` (`next/server`) |
| --- | --- | --- |
| 하는 일 | 뒤의 코드를 정적 셸에서 뺀다 | 실제 사용자 요청이 올 때까지 기다린다 |
| `"use cache"` 안에서 | 바로 끝난다(같이 쓸 수 있다) | 오류 |
| 프리페치 | 캐시·프리페치될 수 있다 | 요청 때만 |
| 번들 문서(`connection.md`) | Cache Components 에서는 **이쪽을 먼저** | 꼭 실제 요청까지 기다려야 할 때만 |

- 지금 코드(`room` · `list` · `mine` · `register` · `seoul` · `lists` · `store` · `(map)/layout`)는 모두 `connection()` 을 쓴다. `io()` 를 쓰는 곳은 없다. **새로 쓰는 코드**에서 "현재 시각만 요청 때 재면 되는" 경우는 `io()` 를 쓴다.
- 둘 다 `<Suspense>` 안에 둔다.
- **`export const dynamic = "force-dynamic"` 은 쓸 수 없다.** Cache Components 에서 없어진 설정이다.
- 「확인 N일 전」 같은 계산은 순수 함수(`lib/freshness.ts`)로 둔다. 컴포넌트는 서버가 넘긴 `nowIso` 로 결과만 그린다.

```tsx
import { io } from "next/cache"

async function RecentBadge() {
  await io() // 정적 셸에 넣지 않고 요청 때 계산한다
  const count = await getRecentReportCount()
  return <span className="text-body-small">이번 주 {count}곳 등록</span>
}
```

### 4.5 캐시를 쓰게 되면 (`"use cache"`)

지금은 `generateMetadata` 다섯 곳에만 있고 `cacheLife`·`cacheTag` 는 쓰지 않는다. 화면 데이터를 캐시하게 되면 아래를 지킨다.

- 캐시 함수는 반드시 `async` 이고, `cacheLife` 를 함께 쓴다. 지우는 데 쓸 이름은 `cacheTag` 로 붙인다.
- 캐시 함수 **안에서** `cookies()`·`headers()`·`searchParams` 를 읽지 않는다. 밖에서 읽어 **값을 인자로** 넘긴다.
- 캐시 함수 안에서 `new Date()` 로 현재 상태를 계산하면 **모두에게 같은 값이 재사용된다.** 시각 계산은 캐시 밖에서 한다(4.4절).
- 파일 맨 위에 `"use cache"` 를 두면 그 파일에서 export 한 함수가 모두 캐시 함수가 되고, 모두 `async` 여야 한다. 상수나 보통 함수는 지시어가 없는 파일에 둔다.
- 인자와 반환값은 직렬화할 수 있어야 한다.

### 4.6 데이터 공급 계층

- 화면은 `@/lib/data`(`src/lib/data/index.ts`)만 부른다. 예시 데이터 숨김(`SHOW_SAMPLES`)과 가려진 가게 걸러내기가 여기서 일어난다. 화면이 이 일을 다시 하지 않는다.
- 저장 방식(Postgres ↔ `.data/db.json`)은 `db.ts` 안에서만 바뀐다. 컴포넌트 코드는 그대로다.
- 어드민 화면은 `@/lib/data/admin` · `datasets` 를 서버 컴포넌트와 Server Action 에서만 쓴다.

### 4.7 한 요청 안의 중복 조회

저장소 읽기는 `db.ts` 의 `shared()` 가 `React.cache` 로 감싸 두었다. 레이아웃·페이지·`generateMetadata` 가 `@/lib/data` 의 읽기 함수를 각각 불러도 화면 요청 하나에 저장소는 한 번만 읽는다. `React.cache` 는 **요청 하나 안에서만** 공유된다.

- 컴포넌트에서 따로 `React.cache` 를 감싸지 않는다. `@/lib/data` 의 읽기 함수를 필요한 곳에서 그대로 부른다.
- 읽기 함수가 돌려준 값은 같은 요청의 여러 곳이 함께 쓴다. 받은 배열·객체를 고치지 않고 `filter`·`map` 으로 새 값을 만든다.
- 어드민 읽기(`@/lib/data/admin` 의 `adminRead*`)는 `load()` 를 직접 불러 부를 때마다 읽는다.

### 4.8 클라이언트 컴포넌트에 데이터 넘기기

`useEffect` 로 처음 데이터를 가져오지 않는다. 서버에서 읽는다.

- 값이 준비되어 있으면 props 로 넘긴다(지금 방식).
- 기다리지 않고 바로 보여 주고 싶으면 Promise 를 prop 으로 넘기고, 클라이언트에서 `use()` 로 읽는다(`<Suspense>` 필요).
- 쓰기를 한 뒤 화면을 다시 그릴 때는 `router.refresh()` 를 쓴다. 다시 `fetch` 하지 않는다.

---

## 5. 페이지·레이아웃 props

(문서: `03-api-reference/03-file-conventions/page.md` · `layout.md`)

- `params`, `searchParams` 는 **Promise** 다. 서버에서는 `await` 로, 클라이언트에서는 `use()` 로 읽는다. 16 에서 동기 접근은 없어졌다.
- 타입은 전역 헬퍼 `PageProps<"/경로">`, `LayoutProps<"/경로">` 를 쓴다(import 할 필요 없음).
- 레이아웃은 `searchParams` 와 현재 경로를 받을 수 없다. 페이지 prop 이나 클라이언트 훅을 쓴다. 지도 홈의 필터(`?rice=…`)는 그래서 `MapShell` 이 `useSearchParams` 로 읽는다.
- 레이아웃에서 `params` 를 맨 위에서 `await` 하지 말고, 필요한 아래 컴포넌트에서 `await` 한다. 그래야 정적 셸이 커진다.

```tsx
export default async function StorePage(props: PageProps<"/store/[id]">) {
  const { id } = await props.params;
  return <StoreDetail id={id} />;
}
```

---

## 6. 쓰기: route handler 와 Server Action

### 6.1 사용자 화면: `send()` → `/api/*` → `db.ts`

사용자 화면의 등록·평가·글·리스트 저장은 클라이언트 컨테이너가 `@/lib/me` 의 `send(url, body)` 로 route handler(`src/app/api/*`)를 부른다. route handler 는 `db.ts` 를 거친다. 규칙 검사(하루 한도, 중복 반경, 숨김 기준)는 `db.ts`·`wiki.ts`·`community.ts` 에서만 한다. 컴포넌트에서는 다시 검사하지 않는다(화면 안내용 미리 보기는 괜찮다).

- `send()` 는 `content-type: application/json` 과 기기 표시 헤더 `x-ddy-device`, 닉네임을 붙여 POST 한다. 사진은 `uploadPhoto()` 가 같은 헤더로 `/api/photos` 에 올린다. 컴포넌트에서 `fetch` 로 직접 쓰기를 보내지 않는다.
- route handler 는 `@/lib/request` 의 입구를 차례로 지난다. 새 쓰기 route handler 도 같은 순서로 쓴다.

| 단계 | 함수 | 거절 |
| --- | --- | --- |
| 출처·형식·크기 | `readJson(req)` | 다른 출처 403 · `application/json` 아님 415 · 64KB 초과 413 · 읽지 못함 400 |
| 누가 | `whoFrom(req, body.nick)` | 기기 표시 없음 400 |
| 입력 검사 | `wiki.ts`·`community.ts` 의 `check*` | 422 |
| 규칙·저장 | `db.ts` 쓰기 함수 → `reply()` | 하루 한도 429 · 중복·이미 함·내려간 가게 409 · 남의 것 403 · 없음 404 |

```ts
// src/app/api/<이름>/route.ts
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

- 실패는 `{ ok: false, error }` 와 상태 코드로 온다. 화면은 `res.error` 문구를 그대로 표시한다.
- 내려간 가게(`hidden`·`closed`)는 맞아요·달라요, 「아직 있어요」, 평가를 받지 않는다(409). 화면은 그 칸을 그리지 않는다.

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { send } from "@/lib/me";

export default function VoteBox({ storeId }: { storeId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function vote(ok: boolean) {
    setBusy(true);
    const res = await send(`/api/stores/${storeId}`, { action: "verify", ok });
    setBusy(false);
    // 실패 이유는 res.error 로 받아 화면에 표시한다(throw 하지 않는다)
    if (res.ok) router.refresh();
  }
  // …
}
```

(경로와 body 모양은 설명용이다. 실제 계약은 `src/app/api/*/route.ts` 를 본다.)

### 6.2 어드민: Server Action

(문서: `01-getting-started/07-mutating-data.md` · `02-guides/data-security.md`)

- Server Action 은 `"use server"` 파일(`src/app/admin/actions.ts`)에 두고 클라이언트 컴포넌트에서 import 한다. 클라이언트 컴포넌트 안에서는 정의할 수 없다.
- 누구나 직접 POST 로 부를 수 있으므로 **함수마다 권한을 확인한다**(`allowed()` → `adminAccess()`).
- 어드민 화면도 화면마다 권한을 확인한다. 레이아웃에서는 막지 않는다. 내용은 `<AdminGate>` 로 감싸고(잠기면 잠김 안내가 대신 나온다), 머리글의 단추·링크는 `<AdminOnly>` 로 감싼다(잠기면 그리지 않는다). 머리글의 제목·설명은 밖에 둔다. 시안 화면도 같다.
- production(`next start`·도커 앱·Vercel)에서는 `ADMIN_KEY` 가 없으면 `adminAccess()` 가 늘 잠김을 돌려준다.
- 예상할 수 있는 실패는 throw 하지 말고 `{ ok: false, error }` 로 돌려준다. 화면은 `useActionState` 나 반환값으로 표시한다.
- `redirect()` 뒤의 코드는 돌지 않는다. 캐시 비우기는 그 앞에서 한다.
- 캐시 비우기: 지금은 `revalidatePath("/", "layout")` 를 쓴다. 태그 캐시(4.5절)를 쓰게 되면 아래를 따른다(문서: `revalidateTag.md` · `updateTag.md`).
  - 기본은 `revalidateTag(tag, "max")` 다. 오래된 내용을 보이면서 뒤에서 새로 받는다. 두 번째 인자를 빼는 형태는 deprecated 다.
  - Server Action 에서 바꾼 내용을 바로 보여야 하면 `updateTag(tag)` 를 쓴다.
  - route handler 처럼 `updateTag` 를 못 쓰는 곳에서 바로 지워야 하면 `revalidateTag(tag, { expire: 0 })` 를 쓴다.

---

## 7. 화면 상태 유지 (Activity)

(문서: `02-guides/preserving-ui-state.md`)

Cache Components 가 켜져 있으면, 다른 경로로 가도 이전 화면을 없애지 않고 **숨긴다**. 돌아오면 상태가 그대로 남아 있다.

### 7.1 닫혀야 하는 UI 는 직접 닫는다

필터 칸(`FilterSheet`), 시트, 다이얼로그, 메뉴처럼 잠깐 열린 UI 는 돌아왔을 때 열려 있으면 안 된다. 숨겨질 때 닫는다.

```tsx
"use client";

import { useLayoutEffect, useState } from "react";

export default function FilterPanel() {
  const [open, setOpen] = useState(false);

  // 화면이 숨겨질 때(다른 경로로 이동) 닫는다.
  // useLayoutEffect 라서 숨겨지기 전에 동기로 돌아 깜빡이지 않는다.
  useLayoutEffect(() => {
    return () => setOpen(false);
  }, []);
  // …
}
```

- 링크를 누르는 즉시 닫으려면 `<Link onNavigate={…}>` 를 함께 쓴다.
- 지금 코드에는 이 정리가 없다(`useLayoutEffect` 를 쓰는 파일이 없다).

### 7.2 그 밖의 주의

- **Effect 는 숨길 때 정리되고, 다시 보일 때 다시 돈다.** 첫 마운트만 가려야 하면 ref 를 쓴다.
- **지도 인스턴스**(`TteokMap`)는 effect 정리에서 `map.remove()` 한다. 숨김 → 보임 때 다시 만들어지므로, 만드는 비용이 큰 것은 ref 로 지킨다.
- 타이머·`watchPosition`·구독은 effect 정리 함수에서 반드시 푼다.
- 쓰기 결과 문구(「저장했어요」)는 돌아왔을 때 다시 보이지 않도록 `useLayoutEffect` 정리에서 지운다.
- **E2E**: 숨겨진 화면도 DOM 에 남는다.
  - `getByRole`·`getByLabel`·`getByPlaceholder` 는 보이는 것만 찾는다.
  - `.locator()` 는 숨겨진 것도 찾으므로 `.filter({ visible: true })` 를 붙인다.
  - `tests/e2e/*.spec.ts` 에서 `.locator()` 를 쓸 때 주의한다.

---

## 8. 성능 패턴

### 8.1 메모이제이션

React Compiler 가 꺼져 있어 자동 메모이제이션은 없다. 그래도 **측정 없이 `memo`·`useMemo`·`useCallback` 을 붙이지 않는다.**

- 예외: 지도 홈처럼 가게 수에 비례해 비싼 계산(`applyFilters` → `matchQuery` → 범위 안 → 정렬)은 `useMemo` 로 둔다(`MapShell`).
- 지도에 넘기는 콜백처럼, 바뀌면 지도를 다시 그리게 되는 값도 `useMemo`·`useCallback` 으로 둔다.

### 8.2 지연 로딩

(문서: `02-guides/lazy-loading.md`)

- 서버 컴포넌트는 저절로 코드 분할된다. 지연 로딩은 **클라이언트 컴포넌트**에 쓴다.
- 브라우저 전용의 무거운 라이브러리는 effect 안에서 `import()` 로 부른다. 본보기는 `TteokMap` 의 `import("maplibre-gl")` 와 `setWorkerUrl("/maplibre/…")` 다. 부품 하나를 통째로 미루려면 `next/dynamic` 을 쓴다.
- `next/dynamic` 의 `ssr: false` 는 **클라이언트 컴포넌트 안에서만** 쓸 수 있다. `dynamic()` 은 모듈 최상위에서 부르고, 경로는 글자로 쓴다.

### 8.3 이미지·폰트

- 사진은 `/api/photos/[id]` 가 내려 준다. Supabase Storage(비공개 버킷)에 있어도 앱 서버가 받아 같은 주소로 내려 주므로 화면 코드의 사진 주소는 바뀌지 않는다(`src/lib/data/photos.ts`). `next/image` 로 바꾸면 `width`·`height` 를 직접 넣는다.
- 모든 이미지에 `alt` 를 둔다. 호랑이 로고는 혼자 쓰이면 `alt="떡볶여지도"`, 이름 글자 옆이면 `alt=""` 다(디자인 시스템 「로고와 이름 글씨」).
- 폰트는 `src/app/layout.tsx` 의 `next/font/local`(조선100년체 · 이름 글씨) 설정과 `pretendard` 를 쓴다. 컴포넌트에서 새로 불러오지 않는다.

### 8.4 링크

- 내부 이동은 `next/link` 의 `<Link>` 를 쓴다. `<a href>` 로 내부 이동하지 않는다. 길찾기(네이버·카카오)처럼 외부로 나가는 것은 `<a>` 를 쓴다.
- 이동이 느릴 때 즉시 표시가 필요하면 `useLinkStatus` 를 쓴다. 메뉴 이동 때 **화면 전체를 덮는 로딩은 쓰지 않는다**. 첫 화면 전환(`IntroZoom`)은 지도 홈에만 쓴다.
- 아래 메뉴·아래 시트 때문에 이동 뒤 내용이 가려지면 CSS `scroll-padding-bottom` 으로 맞춘다.

### 8.5 큰 목록

가게 목록은 지도 범위 안의 것만 그려서 가상화 없이 돈다. 가상화 라이브러리는 설치되어 있지 않다. 필요해지면 먼저 팀에 확인한다.

---

## 9. Props 설계 패턴

### 9.1 HTML 속성 확장

기본 요소나 base-ui 원형을 감싸는 부품은 그 props 를 확장하고, `className` 을 `cn()` 으로 **마지막에** 합친다. `...props` 는 원형에 넘기고, `data-slot` 을 붙인다. 본보기는 `ui/chip.tsx` 다.

```tsx
import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

function Panel({ className, ...props }: ComponentProps<"section">) {
  // 카드·시트 바탕은 background-secondary(=bg-card), 모서리 radius-12(=rounded-lg)
  return <section data-slot="panel" className={cn("rounded-lg border border-border bg-card p-4", className)} {...props} />
}

export { Panel }
```

- `ref` 는 React 19 방식으로 일반 prop 으로 받는다(`forwardRef` 를 쓰지 않는다).
- 켜짐은 `selected`·`open`·`active`, 바뀜 알림은 `onXChange`, 형태는 `variant`·`size` 로 이름 짓는다.
- 기본은 **제어 부품**이다. 상태는 컨테이너가 갖고, 부품은 값과 `onXChange` 를 받는다.

### 9.2 변형: CVA

변형이 여럿이면 `class-variance-authority` 로 정의하고 `xVariants` 를 함께 export 한다.

```tsx
import { cva, type VariantProps } from "class-variance-authority"
import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

const noticeVariants = cva("rounded-md border p-4 text-body-medium", {
  variants: {
    tone: {
      default: "border-border bg-card text-foreground",
      brand: "border-input bg-secondary text-secondary-foreground",
    },
  },
  defaultVariants: { tone: "default" },
})

function Notice({ className, tone, ...props }: ComponentProps<"div"> & VariantProps<typeof noticeVariants>) {
  return <div data-slot="notice" className={cn(noticeVariants({ tone }), className)} {...props} />
}

export { Notice, noticeVariants }
```

### 9.3 토큰 유틸: 정의된 것만 쓴다

Tailwind 는 `@theme` 에 없는 이름의 클래스를 **아무 경고 없이 무시**한다. 그래서 쓸 수 있는 이름을 먼저 확인한다.

| 묶음 | 쓸 수 있는 클래스 | 정의된 곳 |
| --- | --- | --- |
| 색 (shadcn) | `bg-background` `text-foreground` `bg-card` `bg-popover` `bg-primary` `text-primary-foreground` `bg-secondary` `text-secondary-foreground` `bg-muted` `text-muted-foreground` `bg-accent` `text-destructive` `border-border` `border-input` `ring-ring` | `globals.css` `@theme inline` |
| 색 (우리 것) | `bg-brand-red`(찜 하트·이름 글씨 빨강) `bg-report` `text-report-foreground`(제보·등록) `text-link` `bg-map-paper` `text-wordmark` `bg-spicybg` `text-spicytext` `bg-stampbg` `text-loc` `text-star`(별점의 별) · 맵기 `bg-chart-1`~`5` | 같은 곳 |
| 색 (hover · active 단계) | `bg-primary-hover` `bg-primary-active`(주 행동) `bg-secondary-hover` `bg-secondary-active`(두 번째 행동) `bg-report-hover` `bg-report-active`(제보) `bg-ghost-hover` `bg-ghost-active`(투명 버튼·목록 칸·안 고른 칩) | 같은 곳 |
| 색 (상태 · 뒤집힌 면) | `bg-disabled` `text-disabled-foreground`(쓸 수 없음) `bg-inverse` `text-inverse-foreground` `text-inverse-action`(스낵바) `border-invalid`(오류 테두리) `bg-scrim`(시트 · 다이얼로그 뒤 가림막) | 같은 곳 |
| 그림자 | `shadow-elevation-1`(검색창·카드) `shadow-elevation-2`(아래 막대) `shadow-elevation-3`(FAB·시트·스낵바). 고대비 테마에서는 값이 `none` 이다 | 같은 곳 |
| 글자 | `text-display-large` `text-display-medium` `text-heading-1`~`4` `text-body-large` `text-body-medium` `text-body-small` `text-caption` `text-overline` `text-wordmark` `text-map-label` `text-stamp-number`(크기는 9.8절) | `tokens.css` `@theme inline`(생성) |
| 글꼴 | `font-sans`(Pretendard) `font-heading`·`font-serif`(조선100년체) `font-wordmark` | `globals.css` |
| 모서리 | `rounded-sm`~`rounded-4xl`(`--radius` = `radius-12` 기준 배수), `rounded-full` · 토큰 그대로: `rounded-badge`(radius-4) `rounded-control`(radius-8) `rounded-lg`(radius-12) | `globals.css` |
| 치수 | `min-h-target-min` `size-target-min`(48px) `h-field` `min-h-field`(56px) `h-fab` `size-fab`(56px) `h-navbar`(80px) `size-icon-md`(24px) `size-icon-sm`(20px) | `globals.css` `@theme inline` |
| 테마 변형 | `dark:`(`.dark`) `hc:`(`data-theme="hc"`) | `globals.css` `@custom-variant` |
| 누르는 영역 | `.hit-target`(터치 기기에서 보이지 않는 영역을 `target-min` 48px 까지 넓힌다. 모양은 그대로) `.hit`(같은 방식, 44px) | `globals.css` `@layer components` |

- `ui/button.tsx` · `chip.tsx` · `fab.tsx` · `snackbar.tsx` · `input.tsx` · `textarea.tsx` · `text-field.tsx` 가 위 유틸을 쓴다. 부품별 props 는 아래 표다.

| 부품 | props | 내용 |
| --- | --- | --- |
| `Button` `variant` | `filled` · `tonal` · `outlined` · `text` | 디자인 시스템 종류. 주 행동(화면에 하나) · 두 번째 행동 · 보조 · 가장 약한 행동. 기본 · hover · active 세 단계와 disabled 색이 들어 있다. shadcn 종류(`default` · `outline` · `secondary` · `ghost` · `destructive` · `link`)도 그대로 있다 |
| `Button` `size` | `md` · `xl` · `compact` · `icon-md` · `icon-xl` | 디자인 시스템 크기(알약 모양). 보이는 높이 `md` 40px · `xl` 48px · `compact` 32px · `icon-md` 40px · `icon-xl` 48px. `md` · `compact` · `icon-md` 는 `.hit-target` 으로 누르는 영역이 48px 이다. shadcn 크기(`default` · `xs` · `sm` · `lg` · `icon*`)도 그대로 있다 |
| `Chip` `tone` | `filled`(기본) · `tonal` · `ghost` | 켜지면 옥빛 채움 · 켜지면 옥빛 테두리 + 옅은 옥빛 바탕 · 안 고른 것은 테두리와 바탕 없이 글자만 |
| `Chip` `size` | `sm` · `default` · `lg` | 보이는 높이 28 · 32 · 40px. 누르는 영역은 `.hit-target` 48px |
| `Chip` `shape` | `default` · `pill` · `tile` | `radius-8` · 알약 · 그림과 글자를 세로로 쌓는 칸(체크는 오른쪽 위) |
| `Chip` `selected` · `defaultSelected` · `onChange` · `check` | 제어형은 `selected` + `onChange(다음 값)`, 비제어형은 `defaultSelected` | 켜짐은 `aria-pressed`(`role="tab"` 이면 `aria-selected`)와 `data-selected` 로 알린다. `check`(기본 `true`)는 켜졌을 때 체크 아이콘을 붙인다 |
| `Input` · `Textarea` `variant` | `default` · `field` | `field` 는 디자인 시스템의 채운형 칸: 바탕 `bg-muted` · 테두리 `border-input` · 높이 `h-field`(56px, `Textarea` 는 `min-h-field`) · 모서리 `rounded-control` · 글자 `text-body-large` |
| `TextField` · `TextAreaField` | `label` · `help` · `error` · `required` · `fieldClassName` | 라벨(칸 위) + `variant="field"` 칸 + 도움말 · 오류. `id` 는 `useId()`, 도움말 · 오류는 `aria-describedby`, 오류는 `aria-invalid` + `role="alert"` + 아이콘, 필수는 라벨 끝 「(필수)」 글자다. `className` 은 칸에, `fieldClassName` 은 바깥 틀에 간다 |

- `Chip` 의 아이콘 크기 규칙(`[&>svg:not([class*='size-'])]`)은 **직속 `svg`** 에만 걸린다. `span` 등으로 감싼 아이콘은 크기 클래스를 직접 준다. `Button` 의 규칙(`[&_svg:not([class*='size-'])]`)은 안쪽 모든 `svg` 에 걸린다.
- 강한 테두리(`border-strong`)는 `border-input`, 포커스(`border-focus`)는 `ring-ring` · `outline-ring` 이다.
- `rounded-md` 는 9.6px, `rounded-xl` 은 16.8px 이다(`--radius` 12px 의 배수). `radius-8` 은 `rounded-control` 이다.
- 고대비 테마에서 `shadow-elevation-N` 의 값은 `none` 이고, 같은 요소의 `ring-*` · `inset-ring-*` 도 함께 사라진다(둘 다 `box-shadow` 한 속성에 들어간다). `ui/fab.tsx` · `chip.tsx` 는 포커스를 `outline-*` 으로 그린다.
- Semantic 토큰 가운데 유틸이 없는 것: `text-link` · `text-link-hover` · `text-link-active`(갈색. 유틸 `text-link` 는 `text-brand` 옥빛을 가리킨다) · `background-brand` · `background-error` · `icon-*` · `map-water` · `text-on-spicy-*`.
- `tokens.css` 는 손으로 고치지 않는다. 값은 `docs/design-system/tokens.json` 에서 고치고 `pnpm tokens` 를 돌린다.
- 하드코딩 색(`#…`, `bg-[#…]`)과 Tailwind 기본 팔레트(`bg-red-500`)는 쓰지 않는다. 맵기 도장의 `--sNf`·`--sNe` 같은 기존 값은 예외로, `globals.css` 에만 있다.

### 9.4 클래스 합치기 `cn()`

- `@/lib/utils` 의 `cn` 은 `"cn"` 패키지(clsx + tailwind-merge 대체)의 `createCn` 으로 만든다. 우리 토큰 이름을 병합기에 등록해 두었다(`src/lib/utils.ts`).

| 묶음 | 등록된 이름 | 병합 결과 |
| --- | --- | --- |
| 글자 크기 | `display-large` `display-medium` `heading-1`~`4` `body-large` `body-medium` `body-small` `caption` `overline` `map-label` `stamp-number` | `cn("text-sm text-body-large")` 는 `text-body-large` 만 남기고, `cn("text-body-large text-primary-foreground")` 는 둘 다 남긴다 |
| 모서리 | `control` `badge` | `rounded-lg` 와 `rounded-control` 은 뒤에 온 것이 남는다 |
| 그림자 | `elevation-1`~`3` | `shadow-md` 와 `shadow-elevation-3` 은 뒤에 온 것이 남는다 |
| 치수 | `target-min` `field` `fab` `navbar` `icon-md` `icon-sm` | `h-8` 과 `h-field`, `size-4` 와 `size-icon-sm` 은 뒤에 온 것이 남는다 |

- `text-wordmark` 는 색과 글자 크기 양쪽에 정의된 이름이라 등록하지 않았다.
- **모든 파일이 `@/lib/utils` 의 `cn` 을 쓴다.** `ui/` 의 shadcn 파일도 그렇다(11-19 에 모두 바꿨다). `"cn"` 패키지의 기본 `cn` 은 우리 글자 유틸을 글자색으로 봐서 `text-heading-4 text-foreground` 를 넘기면 크기를 조용히 버리고, `rounded-control` · `h-field` 는 앞의 값과 합치지 못한다. shadcn 파일을 새로 받으면 import 부터 `@/lib/utils` 로 바꾼다.
- `@theme` 에 새 토큰 유틸 이름을 더하면 `src/lib/utils.ts` 의 목록에도 더한다.
- 템플릿 문자열로 클래스를 합치지 않는다. 조건부 클래스도 `cn()` 안에 쓴다.

### 9.5 컴포지션

여러 부분으로 나뉘는 UI 는 `children` 과 작은 하위 부품으로 조합한다. 상속은 쓰지 않는다. 묶음 부품(`Sheet` + `SheetHeader` + `SheetContent`)은 shadcn 처럼 **이름을 이어 붙인 별도 export** 로 둔다.

```tsx
<Panel>
  <h2 className="text-heading-3">맛집 리스트</h2>
  <ListRows lists={lists} />
</Panel>
```

### 9.6 상태 표시: 색 + 글자

색만으로 구분하지 않는다(디자인 시스템 · 접근성 2절).

- **맵기**는 고추 개수 + 게이지 도장 + 「맵기 N」 글로 표시한다. `brand/SpiceStamp` 를 쓰고 다시 그리지 않는다.
- **켜진 칩**은 바탕색 + 체크 아이콘 + `aria-pressed` 로 표시한다(`ui/chip.tsx`).
- **확인 중인 가게**는 `brand/PendingTag`(글자 라벨)로 표시한다.
- 오류 빨강(`text-destructive`)과 맵기 빨강(`chart-*`·`spicy*`)은 서로 대신 쓰지 않는다.

### 9.7 아이콘

- 아이콘은 `lucide-react` 에서 가져온다(`components.json` 의 `iconLibrary: "lucide"`). 어드민 아이콘도 lucide 다(`components/admin/Icon.tsx` 의 이름 → 아이콘 표).
- **기호 글자(＋ ✓ ♡ 등)를 아이콘으로 쓰지 않는다.** `Plus` · `Check` · `Heart` 를 쓴다. 본보기는 `lists/AddToListView.tsx`(`Check` · `Plus`), `ui/chip.tsx`(`Check`)다.
- 크기는 `size-icon-md`(24px) · `size-icon-sm`(20px), 획은 `strokeWidth={2}` 다. `Button` · `Chip` 안의 아이콘은 크기 클래스를 주지 않으면 부품이 정한 크기가 된다(9.3절).
- 장식 아이콘에는 `aria-hidden="true"` 를 준다. 아이콘만 있는 버튼에는 `aria-label` 을 준다.
- 맵기 도장(`SpiceStamp`) · 고추(`Chili`) · 별점(`Stars`) · 로고(`Logo`)는 lucide 가 아니라 `brand/` 의 그림이다. 다시 그리지 않는다.

### 9.8 글자 크기: 임의 값을 쓰지 않는다

- 화면·부품에서 `text-[13px]` · `text-[0.8rem]` 같은 임의 글자 크기를 쓰지 않는다. 아래 글자 토큰 유틸을 쓴다. 줄 높이와 자간은 유틸에 들어 있어 `leading-*` 을 따로 주지 않는다.
- `src/` 에 남은 임의 글자 크기는 1곳이다: `ui/button.tsx` 의 shadcn 크기 `sm`(`text-[0.8rem]`). 화면(`src/app` · `src/components` 의 `ui/` 밖)에는 없다.
- Tailwind 기본 크기(`text-xs` · `text-sm` 등)는 `ui/` 의 shadcn 종류·크기와 `brand/Tag.tsx` 에만 있다.

| 크기 / 줄 높이 | 유틸 | 쓰는 곳 (디자인 시스템 「Typography」) |
| --- | --- | --- |
| 56px / 64px | `text-display-large` | 첫 화면 큰 제목 |
| 44px / 52px | `text-display-medium` | 빈 화면·완료 화면 |
| 36px / 44px | `text-heading-1` | 데스크톱 h1 |
| 28px / 36px | `text-heading-2` | 폰 h1 |
| 24px / 32px | `text-heading-3` | 섹션 h2, 다이얼로그 제목 |
| 20px / 28px | `text-heading-4` | 카드 제목, 목록 가게 이름 |
| 18px / 28px | `text-body-large` | 기본 본문, 입력칸, 버튼 |
| 16px / 26px | `text-body-medium` | 주소·거리·도움말, 칩 |
| 14px / 22px | `text-body-small` | 메타 정보(본문 하한) |
| 14px / 20px | `text-caption` | 사진 설명, 아래 막대 이름 |
| 14px / 20px, 자간 넓음 | `text-overline` | 제목 위 분류 글자 |
| 36px / 44px | `text-wordmark` | 이름 글씨 「떡볶여지도」 |
| 18px / 24px | `text-map-label` | 지도 이름표 |
| 20px / 24px | `text-stamp-number` | 도장 숫자 |

- 가장 작은 글자 토큰은 14px 이다. 값의 원본은 `docs/design-system/tokens.json` 이고 `src/app/tokens.css` 로 생성된다.

---

## 10. 디자인 시스템 규칙 요약

([`docs/design-system/README.md`](../design-system/README.md) 에서 컴포넌트 코드에 직접 걸리는 것만)

- **옥빛(`bg-primary`)은 화면마다 주 행동 하나에만** 쓴다(「길찾기」, 선택된 칩, 활성 탭). 두 번째 행동은 `bg-secondary` 다. 제보·등록은 갈색 `bg-report` 하나다.
- 누를 수 있는 것은 기본 · hover · active 세 단계를 함께 쓴다.
- 장식 구분선은 `border-border` 를 쓴다. 입력칸·칩·외곽선 버튼처럼 **뜻을 담는 경계는 `border-input`**(= `border-strong`, 3:1 이상)을 쓴다.
- 바탕은 쪽 = `bg-background`, 카드·시트·검색창 = `bg-card`, 입력칸·칩·아래 막대 = `bg-muted` 다.
- **제목(`h1`~`h3`)은 조선100년체이고 굵기가 하나뿐**이다. `font-bold` 를 주지 말고 크기·색·자간으로 강조한다. 조선100년체는 16px 이상에만 쓴다. 본문은 Pretendard 다.
- 그림자는 지도 위에 뜨는 면에만 쓴다(검색창·카드 elevation-1, 아래 막대 2, FAB·시트·스낵바 3).
- 움직임: 상태 변화 100ms, 시트 250ms, `prefers-reduced-motion` 이면 움직이지 않는다.
- 아이콘은 `lucide-react` 를 쓴다(9.7절). 글자 크기는 글자 토큰 유틸로 쓴다(9.8절).
- 말투: 해요체, 버튼은 동사로 끝낸다(「맞아요」「달라요」「길찾기」). 오류는 무엇이 잘못됐고 어떻게 고치는지 한 문장씩 쓰고, 이모지는 쓰지 않는다.
- **누르는 영역**: 디자인 시스템은 `target-min` 48px 이다. `globals.css` 에 `.hit-target`(48px)과 `.hit`(44px, REQ-W10)이 있다. `ui/` 의 `Button` 디자인 시스템 크기 · `Chip` · `Snackbar` 행동 단추는 `.hit-target` 을 쓴다. 새 부품은 보이는 크기를 48px 로 하거나 `.hit-target` 을 쓴다.

---

## 11. 에러·404

(문서: `01-getting-started/10-error-handling.md` · `03-api-reference/03-file-conventions/not-found.md` · `03-api-reference/04-functions/catchError.md`)

- 지금은 루트 `src/app/not-found.tsx` 만 있다. `error.tsx` 는 없다.
- `error.tsx`·`global-error.tsx` 는 클라이언트 컴포넌트다. `global-error.tsx` 는 루트 레이아웃을 대신하므로 `<html>`·`<body>` 를 직접 넣는다.
- 에러 경계는 **이벤트 핸들러와 비동기 코드의 에러를 잡지 않는다.** `send()` 처럼 직접 받아 상태로 표시한다.
- 부품 하나에 에러 경계를 두려면 `catchError`(`next/error`)를 쓴다.
- `not-found.tsx` 는 props 를 받지 않고, 기본은 서버 컴포넌트다.
- **상태 코드**: `notFound()` 가 스트리밍 시작 **전**에 불리면 404 를 돌려준다. **후**에 불리면 상태는 200 그대로이고, not-found 화면과 `noindex` 만 붙는다. 이 저장소처럼 `<Suspense>` 안에서 가게를 읽는 화면(`/store/[id]`)은 없는 가게도 200 으로 응답할 수 있다. 검색엔진에는 `noindex` 로 막힌다.
- 루트 레이아웃은 하나(`src/app/layout.tsx`)라 `global-not-found.js` 는 필요 없다.

---

## 12. 메타데이터

(문서: `01-getting-started/14-metadata-and-og-images.md`)

- `metadata`·`generateMetadata`·`viewport` 는 **서버 컴포넌트(page·layout)에서만** export 한다.
- `<head>`·`<title>`·`<meta>` 를 JSX 로 직접 쓰지 않는다.
- `robots` 는 `src/app/robots.ts` 가 `USING_SAMPLE_DATA` 로 정한다. 화면에서 따로 막지 않는다.

---

## 13. 접근성

([`docs/design-system/accessibility.md`](../design-system/accessibility.md))

- 뜻에 맞는 HTML 요소를 쓴다(`<nav>` `<header>` `<main>` `<section>` `<article>` `<button>`). 누를 수 있는 `<div>` 를 만들지 않는다.
- 현재 메뉴는 `aria-current="page"`, 켜짐은 `aria-pressed`(탭이면 `aria-selected`), 상태 변화 안내는 `role="status"` 로 알린다.
- 라벨·`aria-labelledby`·`aria-describedby` 로 잇는 id 는 `useId()` 로 만든다. 같은 부품이 한 화면에 여럿(목록의 칸, 시트 안팎) 있어도 겹치지 않는다.
- 끌기(시트 손잡이)는 누르기로도 된다. 지도 두 손가락 확대는 `+`/`-` 버튼으로도 된다.
- 글자 크기는 rem 이고, 높이를 고정하지 않는다. 브라우저 글자 200% 에서 잘리지 않아야 한다. 화면 확대는 막지 않는다.
- 320px(최소 360·390) 폭에서 가로 스크롤이 없다(지도와 표만 예외). 띄어쓰기 없는 긴 글은 `break-keep` + `[overflow-wrap:anywhere]` 로 처리한다.
- 폰 입력칸 글자는 16px 이상이다(iOS 자동 확대 방지, `text-body-medium` 이상). `variant="field"` 칸은 `text-body-large`(18px)다.
- 입력칸은 `TextField` · `TextAreaField` 를 쓴다. 라벨·도움말·오류가 `id` · `aria-describedby` · `aria-invalid` 로 칸과 묶여 있다.
- 누르는 영역은 48px 이다. 보이는 크기가 그보다 작으면 `.hit-target` 을 쓴다(`Button` 의 `md` · `compact` · `icon-md`, `Chip` 에는 들어 있다).
- 아이콘만 있는 버튼에는 `aria-label`, 장식 아이콘에는 `aria-hidden="true"` 를 준다. 기호 글자를 아이콘으로 쓰지 않는다(9.7절).
- 고대비 테마(`data-theme="hc"`)에서만 달라져야 하는 모양은 `hc:` 변형으로 쓴다. 고대비 테마에서는 그림자와 `ring-*` 이 사라지므로 포커스는 `outline-*` 으로 그린다(9.3절).
- 링크는 `text-link` + 밑줄이다. 색만으로 구분하지 않는다.

---

## 14. 안티패턴

| ❌ 하지 말 것 | ✅ 대신 | 근거 |
| --- | --- | --- |
| View 에서 `useState`·`useRouter`·`fetch` | 컨테이너에서 하고 props 로 넘긴다 | 2장 |
| 화면에서 `db.ts`·`pg.ts`·`.data/` 를 직접 읽기 | `@/lib/data` | 4.6절 |
| 컴포넌트에서 등록 규칙(한도·반경)을 다시 구현 | `wiki.ts`·`community.ts`·`db.ts` 에 둔다 | 6.1절 |
| `params.id` 처럼 동기로 읽기 | `const { id } = await props.params` | 5장 |
| `export const dynamic = "force-dynamic"` | `<Suspense>` + `io()`(실제 요청까지 기다리면 `connection()`) | 4.4절 |
| `<Suspense>` 밖에서 비캐시 데이터 `await` | 데이터 부분을 `<Suspense>` 로 감싼다 | 4.1절 |
| `"use cache"` 함수 안에서 `cookies()`·`new Date()` | 밖에서 읽어 인자로 넘기고, 시각 계산은 캐시 밖에서 | 4.5절 |
| 클라이언트에서 `new Date()` 로 첫 렌더 | 서버가 `nowIso` 를 넘긴다 | 2.2절 |
| `localStorage` 를 렌더 중에 바로 읽기 | `useSyncExternalStore`(서버 스냅샷은 빈 값) | 3.1절 |
| `useEffect` 로 첫 데이터 가져오기 | 서버에서 읽어 props, 쓰기 뒤에는 `router.refresh()` | 4.8절 |
| 레이아웃 전체에 `"use client"` | 상호작용 부분만 나눈다 | 3.2절 |
| 서버에서 클라이언트로 일반 함수·`Date` prop | 값(ISO 글자)만, Server Action 은 예외 | 3.4절 |
| Server Action 에서 권한 확인 빼기 | 함수마다 `allowed()` | 6.2절 |
| `@theme` 에 없는 이름의 클래스(Tailwind 가 경고 없이 무시한다) | 9.3절 표에 있는 이름을 쓰고, 없으면 `@theme inline` 에 먼저 잇는다 | 9.3절 |
| 임의 글자 크기 `text-[13px]` | 글자 토큰 유틸(`text-body-small` 등) | 9.8절 |
| 기호 글자(＋ ✓ ♡)를 아이콘으로 | `lucide-react` 의 `Plus` · `Check` · `Heart` | 9.7절 |
| 새 파일에서 `import { cn } from "cn"` | `import { cn } from "@/lib/utils"` | 9.4절 |
| 입력칸마다 라벨·오류 마크업을 다시 짜기 | `TextField` · `TextAreaField` | 9.3절 |
| `ui/` 밖에서 날 `<button>` · `<input>` · `<select>` · `<textarea>` (린트 오류) | `ui/` 의 `Button` · `Chip` · `Input` · `TextField` · `Select`. 줄 전체가 단추인 목록 줄 · 숨긴 파일 선택 · 브랜드 그림 단추처럼 부품이 맞지 않는 곳만 그 줄 위에 `eslint-disable-next-line no-restricted-syntax -- 까닭` | 9.3절 |
| `shadow-sm` · `shadow-md` · `shadow-lg`, 목록 카드의 hover 그림자 | 지도 위에 뜨는 면에만 `shadow-elevation-1`~`3`. hover 는 `hover:border-input` · `hover:bg-ghost-hover` | 10장 |
| 손으로 만든 토스트(`rounded-full bg-foreground …`) · 가림막 `bg-black/10` | `ui/snackbar` 의 `Snackbar` · `bg-scrim` | 9.3절 |
| 글자 토큰 옆에 `leading-relaxed` · `leading-tight` | 줄 높이는 글자 토큰에 들어 있다. 글리프 하나를 맞추는 `leading-none` 만 예외 | 9.8절 |
| 별을 `★` 와 색 값으로 다시 그리기 | `brand` 의 `StarGlyph` · `Stars`(색 `text-star`) | 9.6절 |
| 컴포넌트에서 `fetch` 로 직접 쓰기 POST | `send()` · `uploadPhoto()`(기기 표시 헤더가 붙는다) | 6.1절 |
| 쓰기 route handler 에서 `req.json()` 을 바로 읽기 | `readJson()` → `whoFrom()` | 6.1절 |
| 어드민 화면 내용·단추를 잠금 밖에 두기 | 내용은 `AdminGate`, 머리글 단추·링크는 `AdminOnly` | 6.2절 |
| 어드민 전용 CSS · 옛 클래스(`btn` · `card` · `table` …) (CSS 가져오기는 린트 오류) | `components/admin/bits.tsx` · `controls.tsx` 의 조각과 `ui/` 부품 | 1.2절 |
| `min-[900px]:` 처럼 px 로 쓴 임의 폭을 `sm:` · `lg:` 와 섞기(단위가 달라 순서가 뒤집힌다) | `md:` · `lg:` · `xl:` 같은 이름 있는 폭 | 0장 |
| `bg-red-500`, `#RRGGBB`, `tokens.css` 손 고치기 | 시맨틱 토큰, `tokens.json` + `pnpm tokens` | 9.3절 |
| 제목에 `font-bold`, 조선100년체로 16px 미만 | 크기·색·자간으로 강조, 작은 글자는 Pretendard | 10장 |
| 화면에 옥빛 버튼 여럿 | 주 행동 하나만 `bg-primary` | 10장 |
| 상태를 색만으로 | 색 + 글자/아이콘/개수 | 9.6절 |
| 맵기 도장·별점·로고를 다시 그리기 | `brand/` 부품 | 9.6절 |
| 열린 시트·필터를 그대로 두기 | `useLayoutEffect` 정리에서 닫기 | 7.1절 |
| E2E 에서 `.locator()` 만 쓰기 | `getByRole`, 또는 `.filter({ visible: true })` | 7.2절 |
| 측정 없이 `memo`·`useCallback` | 비싼 계산·지도 콜백에만 | 8.1절 |
| 템플릿 문자열로 클래스 합치기 | `cn()` | 9.4절 |

---

## 15. 컴포넌트 작성 체크리스트

### 구조

- [ ] 자리가 맞는가: `ui/`(도메인 없음) · `brand/`(도메인 있음) · `layout/`(쪽 틀) · `<screen>/`(한 화면)
- [ ] 화면이면 컨테이너와 View 로 나눴고, 계약이 `<screen>/types.ts` 에 있는가
- [ ] View 에 상태·라우터·`fetch`·브라우저 API 가 없는가
- [ ] 형식이 같은 폴더 기존 파일과 같은가(export 방식, 세미콜론)

### 서버/클라이언트

- [ ] 서버 컴포넌트로 충분한가? `"use client"` 는 꼭 필요한 파일에만 있는가
- [ ] 서버에서 클라이언트로 넘기는 props 가 직렬화되는가(함수·`Date` 없음)
- [ ] 클라이언트 컴포넌트가 `@/lib/data`·`db.ts`·서버 전용 환경 변수를 import 하지 않는가
- [ ] 기기 저장값을 `useSyncExternalStore` 로 읽는가

### 데이터

- [ ] 비캐시 데이터·현재 시각을 읽는 부분이 `<Suspense>` 안에 있는가
- [ ] 레이아웃에서 읽는 데이터는 따로 `<Suspense>` 로 감쌌는가
- [ ] `params`·`searchParams` 를 `await`/`use()` 로 읽는가
- [ ] 화면은 `@/lib/data` 만 부르고, 쓰기는 `send()` → `/api/*`(어드민은 권한을 확인하는 Server Action)인가
- [ ] 새 쓰기 route handler 가 `readJson()` → `whoFrom()` 을 먼저 지나는가
- [ ] 어드민 화면의 내용이 `AdminGate`, 머리글 단추·링크가 `AdminOnly` 안에 있는가

### 상태 유지

- [ ] 시트·필터·다이얼로그가 다른 경로에 갔다 오면 닫혀 있는가
- [ ] 타이머·위치 추적·지도 인스턴스를 정리 함수에서 푸는가

### 디자인 시스템

- [ ] 쓴 토큰 클래스가 모두 `@theme` 에 정의돼 있는가(9.3절 표)
- [ ] 임의 글자 크기(`text-[Npx]`)가 없고 글자 토큰 유틸을 썼는가(9.8절)
- [ ] 아이콘이 `lucide-react` 이고, 기호 글자를 아이콘으로 쓰지 않았는가(9.7절)
- [ ] `cn` 을 `@/lib/utils` 에서 가져왔는가
- [ ] 버튼·칩·입력칸이 `ui/` 의 `Button`(`filled` · `tonal` · `outlined` · `text`) · `Chip` · `TextField` 인가
- [ ] 하드코딩 색·기본 팔레트가 없는가
- [ ] 옥빛 주 행동이 화면에 하나인가, 뜻을 담는 경계는 `border-input` 인가
- [ ] 제목에 `font-bold` 가 없는가
- [ ] 상태가 색 + 글자/아이콘인가, 맵기·별점·로고는 `brand/` 부품인가

### 접근성

- [ ] 뜻에 맞는 요소와 필요한 ARIA(`aria-label`·`aria-pressed`·`aria-current`)가 있는가
- [ ] 키보드로 조작되고, 포커스가 보이는가(`focus-visible:ring-ring`)
- [ ] 폰에서 누르는 영역이 48px 이고(`.hit-target`), 입력 글자가 16px 이상인가
- [ ] 아이콘만 있는 버튼에 `aria-label` 이 있는가
- [ ] 390 · 768 · 1280 폭에서 가로 스크롤이 없는가

### 확인 명령

- [ ] `pnpm typecheck` · `pnpm lint` 를 통과한다
- [ ] 관련 E2E: `pnpm exec playwright test --project=mobile-390 -g "…"`(필요하면 `tablet-768`·`desktop-1280` 도)
- [ ] 규칙 함수·`db.ts`·`request.ts`·`photos.ts`·`admin.ts` 를 고쳤으면 `pnpm test`
