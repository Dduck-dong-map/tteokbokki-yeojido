# Next.js 16.4.2 규칙 정리

이 문서는 프로젝트에 설치된 **Next.js 16.4.2**의 공식 문서(`node_modules/next/dist/docs/`)를 근거로, App Router 개발 시 지켜야 할 규칙을 한국어로 정리한 것이다.

- **근거 범위**: 패키지에 함께 배포된 문서만 사용했다. 학습 데이터나 블로그 글은 근거로 쓰지 않았다.
- **우선순위**: 이 문서와 프로젝트 문서(`docs/design-system/`, `.claude/hooks/`)가 다르면 **프로젝트 문서가 우선**이다. 이 문서는 프레임워크 사실을, 프로젝트 문서는 이 프로젝트의 결정을 담는다.
- **갱신**: Next.js 버전을 올리면 파일명과 내용을 함께 다시 확인한다.
- 각 절 끝의 `출처`는 `node_modules/next/dist/docs/01-app/` 아래 경로다.
- 이전에 쓰던 "Next.js 15.5.3 개발 지침"을 대체한다. 그 지침에서 16.4.2와 맞지 않는 부분은 A절에 정리했다.

---

## A. 이전(15.5.3) 지침과 달라진 점

이전 지침의 예시 중 16.4.2에서 **그대로 쓰면 안 되는 것**이다.

| 이전 지침                                                                | 16.4.2                                                                                         | 근거        |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- | ----------- |
| `middleware.ts`, `export function middleware`                            | `proxy.ts`, `export function proxy`                                                            | 1.2절       |
| `middleware`의 `config.runtime: 'nodejs'` 설정                           | `proxy`의 런타임은 `nodejs` 고정, **설정할 수 없음**                                           | 10.2절      |
| `experimental.turbo.rules`                                               | 최상위 `turbopack.rules`                                                                       | 1.2절, 14장 |
| `params`/`searchParams` 동기 접근은 "deprecated"                         | 동기 접근 **제거**(항상 `await`)                                                               | 1.2절       |
| `fetch`의 `next.revalidate`/`next.tags`로 캐시 제어                      | 계속 동작하지만, Cache Components에서는 `"use cache"` + `cacheLife`/`cacheTag` 권장            | 6장         |
| `revalidateTag('tag')`                                                   | `revalidateTag('tag', 'max')` — 두 번째 인자 필수                                              | 5.6절       |
| `return unauthorized()`, `return forbidden()`을 `next/server`에서 import | `next/navigation`의 함수이며 **throw**한다(`return` 불필요). 실험적 `authInterrupts` 설정 필요 | 8.4절       |
| Typed Routes를 `experimental.typedRoutes`로 켬                           | 최상위 `typedRoutes: true`(안정화)                                                             | 11장        |
| `optimizePackageImports`에 `lucide-react` 추가                           | `lucide-react`는 **기본으로 최적화됨**. 이 옵션은 여전히 실험적                                | 14장        |
| `npm run typecheck`·`format:check`·`check-all`                           | 이 프로젝트에 없는 스크립트. `pnpm lint`, `pnpm build`(타입 검사 포함)를 쓴다                  | 16장        |

---

## 0. 이 프로젝트의 현재 설정 (2026-10-25 기준)

| 항목                         | 값                              | 이 문서에서 관련 절 |
| ---------------------------- | ------------------------------- | ------------------- |
| `cacheComponents`            | `true`                          | 5장                 |
| `partialPrefetching`         | `true`                          | 5.7절               |
| 루트 레이아웃                | `(frontend)`, `(payload)` 두 개 | 2.4절, 8.3절        |
| `next.config.ts` 래퍼        | `withPayload(nextConfig)`       | —                   |
| `experimental.agentFeedback` | `true`                          | —                   |

> `cacheComponents`·`partialPrefetching`은 방식을 따로 정하기 전까지 바꾸지 않는다.

---

## 1. 버전 요구사항과 16에서 바뀐 점

### 1.1 실행 환경

| 요구사항   | 최소 버전                              |
| ---------- | -------------------------------------- |
| Node.js    | 20.9.0                                 |
| TypeScript | 5.1.0                                  |
| 브라우저   | Chrome·Edge·Firefox 111+, Safari 16.4+ |

> 프로젝트 `package.json`의 `engines`는 이보다 높은 `^22.23.4 || >=24.22.1`을 요구한다. 프로젝트 기준을 따른다.

### 1.2 반드시 알아야 할 변경 (15 → 16)

- **요청 API는 비동기로만 접근한다.** `cookies()`, `headers()`, `draftMode()`, `params`, `searchParams`를 동기로 읽던 호환 기간이 끝났다. 항상 `await`한다.
- **`middleware`는 `proxy`로 이름이 바뀌었다.** 파일명 `proxy.ts`, 함수명 `proxy`. `proxy`의 런타임은 `nodejs`로 고정이며 바꿀 수 없다.
- **Turbopack이 기본이다.** `next dev`·`next build`에 `--turbopack` 플래그가 필요 없다. 설정은 `experimental.turbopack`이 아니라 최상위 `turbopack`에 둔다.
- **`next lint` 명령이 제거되었다.** ESLint CLI를 직접 쓴다(`pnpm lint` → `eslint`). `next build`는 더 이상 린트를 돌리지 않는다.
- **`revalidateTag`는 두 번째 인자(`cacheLife` 프로필)가 필수다.** 예: `revalidateTag('posts', 'max')`.
- **`cacheLife`, `cacheTag`는 안정화되었다.** `unstable_` 접두어 없이 `next/cache`에서 import한다.
- **병렬 라우트 슬롯(`@slot`)마다 `default.js`가 필수다.** 없으면 빌드가 실패한다.
- **`next/image` 기본값 변경**: `minimumCacheTTL` 4시간, `qualities` 기본 `[75]`, `imageSizes`에서 16 제거, 로컬 IP 최적화 차단, 리다이렉트 최대 3회. 쿼리스트링이 붙은 로컬 이미지는 `images.localPatterns.search` 설정이 필요하다.
- **`images.domains`는 폐기 예정**이다. `images.remotePatterns`를 쓴다.
- **`serverRuntimeConfig`·`publicRuntimeConfig` 제거.** 환경변수를 직접 쓴다(13장).
- **스크롤 동작**: 전역 `scroll-behavior: smooth`를 Next.js가 더 이상 덮어쓰지 않는다. 예전처럼 덮어쓰게 하려면 `<html data-scroll-behavior="smooth">`.
- **`next dev`와 `next build`의 출력 폴더가 분리**되었다(`next dev`는 `.next/dev`). 동시에 실행할 수 있다.
- **빌드 출력에서 `size`, `First Load JS` 지표가 빠졌다.** 성능은 Lighthouse 등으로 잰다.
- **AMP 제거**, `devIndicators`의 일부 옵션 제거, `unstable_rootParams` → `next/root-params`.

출처: `02-guides/upgrading/version-16.md`

---

## 2. 프로젝트 구조와 라우팅 파일

### 2.1 라우팅 특수 파일

| 파일           | 역할                                                          |
| -------------- | ------------------------------------------------------------- |
| `layout`       | 여러 페이지가 공유하는 UI. 이동해도 상태 유지·재렌더링 없음   |
| `page`         | 해당 경로의 UI. **`page`나 `route`가 있어야 경로가 공개된다** |
| `loading`      | 로딩 UI(자동으로 `<Suspense>` 경계가 됨)                      |
| `not-found`    | `notFound()` 호출 시 UI                                       |
| `error`        | 에러 경계 UI                                                  |
| `global-error` | 루트 레이아웃의 에러까지 잡는 UI                              |
| `route`        | API 엔드포인트(Route Handler)                                 |
| `template`     | 이동할 때마다 다시 마운트되는 레이아웃                        |
| `default`      | 병렬 라우트 대체 페이지                                       |

### 2.2 렌더링 계층 순서

바깥에서 안쪽으로: `layout` → `template` → `error` → `loading` → `not-found` → `page`(또는 하위 `layout`).

### 2.3 폴더 규칙

- `[slug]` 동적 세그먼트, `[...slug]` catch-all, `[[...slug]]` 선택적 catch-all.
- `(group)` 라우트 그룹: URL에 포함되지 않는다. 레이아웃을 나누는 용도.
- `_folder` 비공개 폴더: 해당 폴더와 하위 폴더 전체가 라우팅에서 빠진다.
- `app` 안에 일반 파일을 두어도 `page`/`route`가 아니면 공개되지 않는다(colocation 안전).
- `.env*` 파일은 `src` 안이 아니라 **프로젝트 루트**에 둔다.

### 2.4 루트 레이아웃이 여러 개일 때

- 최상위 `app/layout`을 두지 않고 라우트 그룹마다 `layout`을 두면 각각 루트 레이아웃이 된다. 각 루트 레이아웃에 `<html>`, `<body>`가 있어야 한다.
- **서로 다른 루트 레이아웃 사이를 이동하면 전체 페이지를 새로 불러온다**(클라이언트 전환이 아님).

### 2.5 App Router만 쓴다

- 이 프로젝트는 `src/app`(App Router)만 쓴다. `pages/` 폴더, `getServerSideProps`, `getStaticProps`, `_app`, `_document`는 Pages Router 전용이므로 쓰지 않는다.

### 2.6 병렬 라우트 (`@slot`)

- `@folder`로 이름 있는 슬롯을 만들면 부모 레이아웃이 같은 이름의 prop으로 받는다. 슬롯은 URL에 포함되지 않는다. `children`은 암묵적인 슬롯이다.
- **슬롯마다 `default.js`가 필수다**(없으면 빌드 실패, 1.2절). 새로고침 등 전체 로드 때 현재 URL과 맞지 않는 슬롯에는 `default.js`가 렌더링된다.
- 조건부 슬롯(예: 역할별 화면)은 레이아웃이 하나만 반환해도 **모든 슬롯이 서버에서 실행되고 응답에 포함된다.** 권한 확인은 각 슬롯 페이지나 데이터 접근 계층 안에서 한다.
- 슬롯마다 `loading`, `error`를 따로 둘 수 있다.

### 2.7 가로채기 라우트 (`(.)folder`)

- 현재 레이아웃 안에서 다른 경로를 보여 준다(예: 목록 위에 사진 모달). 공유 URL로 직접 들어오거나 새로고침하면 가로채지 않고 원래 페이지가 열린다.
- `(.)` 같은 단계, `(..)` 한 단계 위, `(..)(..)` 두 단계 위, `(...)` `app` 루트 기준. **파일 시스템이 아니라 라우트 세그먼트 기준**이며 `@slot` 폴더는 단계로 세지 않는다.
- 모달은 병렬 라우트와 함께 구현한다. 닫을 때는 `router.back()`이나 `<Link>`를 쓰고, 슬롯이 `null`을 반환하는 경로와 일치하게 만들어야 모달이 사라진다.

> 병렬·가로채기 라우트는 쓰기 전에 사용자에게 확인한다.

출처: `01-getting-started/02-project-structure.md`, `03-api-reference/03-file-conventions/layout.md`, `03-api-reference/03-file-conventions/parallel-routes.md`, `03-api-reference/03-file-conventions/intercepting-routes.md`

---

## 3. 레이아웃과 페이지

- 루트 레이아웃은 필수이며 `<html>`, `<body>`를 정의해야 한다.
- 루트 레이아웃에 `<title>`, `<meta>` 같은 `<head>` 태그를 **직접 쓰지 않는다.** Metadata API를 쓴다(9장).
- 레이아웃은 이동 시 재렌더링되지 않으므로:
  - `searchParams`를 받을 수 없다 → 페이지의 `searchParams` prop이나 클라이언트의 `useSearchParams()`를 쓴다.
  - 현재 경로를 알 수 없다 → 클라이언트 컴포넌트에서 `usePathname()`을 쓴다(활성 메뉴 표시 등).
  - 하위 세그먼트에 데이터를 넘길 수 없다 → 같은 데이터를 각자 요청하고 `React.cache`로 중복을 없앤다.
- `params`와 `searchParams`는 **Promise**다. `await` 또는 React `use()`로 읽는다.
- 타입은 전역 헬퍼 `PageProps<'/경로'>`, `LayoutProps<'/경로'>`를 쓴다(import 불필요, `next dev`·`next build`·`next typegen` 때 생성).

```tsx
// app/blog/[slug]/page.tsx
export default async function Page(props: PageProps<"/blog/[slug]">) {
  const { slug } = await props.params;
  return <h1>{slug}</h1>;
}
```

- 페이지에서 `searchParams`를 쓰면 그 페이지는 요청 시점 렌더링이 된다.

> **문서 간 차이**: `layout.md`에는 "Next.js 15에서는 `params`를 동기로도 읽을 수 있다"는 문장이 남아 있다. 16 업그레이드 문서는 동기 접근이 **완전히 제거되었다**고 명시한다. 16에서는 업그레이드 문서를 따른다.

출처: `01-getting-started/03-layouts-and-pages.md`, `03-api-reference/03-file-conventions/layout.md`

---

## 4. 서버 컴포넌트와 클라이언트 컴포넌트

### 4.1 기본값과 선택 기준

- 레이아웃과 페이지는 **기본이 서버 컴포넌트**다.
- 클라이언트 컴포넌트가 필요한 경우: 상태·이벤트 핸들러(`onClick`), `useEffect`, 브라우저 API(`window`, `localStorage`), 커스텀 훅.
- 서버 컴포넌트가 맞는 경우: DB·API 데이터 조회, 비밀값 사용, 브라우저로 보내는 JS 줄이기.

### 4.2 `"use client"` 규칙

- 파일 맨 위(import 위)에 둔다. 이 파일이 **서버/클라이언트 경계**가 된다.
- 표시된 파일이 import하는 모듈과 직접 렌더링하는 컴포넌트는 모두 클라이언트 번들에 들어간다. 하위 파일마다 다시 붙일 필요는 없다.
- `children` 등 prop으로 받은 서버 컴포넌트는 클라이언트 번들에 들어가지 않는다(서버에서 렌더링된 결과만 전달).
- **상호작용이 필요한 작은 부분에만** `"use client"`를 붙인다. 레이아웃 전체를 클라이언트로 만들지 않는다.
- 서버 → 클라이언트로 넘기는 props는 **직렬화 가능**해야 한다.

### 4.3 Context Provider

- 서버 컴포넌트는 React Context를 쓸 수 없다. Provider를 클라이언트 컴포넌트로 만들고 `children`을 받게 한다.
- Provider는 **트리에서 가능한 깊은 곳**에 둔다(`<html>` 전체가 아니라 `{children}`만 감싸기). 정적 부분 최적화에 유리하다.

### 4.4 서드파티 컴포넌트

- `"use client"`가 없는데 클라이언트 기능을 쓰는 라이브러리 컴포넌트는 직접 만든 클라이언트 컴포넌트로 감싸서 쓴다.

### 4.5 서버 전용 코드 보호

- `NEXT_PUBLIC_`이 없는 환경변수는 클라이언트 번들에서 빈 문자열로 바뀐다.
- 서버 전용 모듈에는 `import "server-only"`를 넣어, 클라이언트에서 import하면 빌드 에러가 나게 한다. 반대 용도로 `client-only`가 있다.

### 4.6 하지 말 것

- **상태·이벤트 핸들러·브라우저 API가 없는 컴포넌트에 `"use client"`를 붙이지 않는다.**
- **클라이언트 컴포넌트에서 DB 조회 같은 서버 전용 함수를 부르지 않는다.** 서버 컴포넌트에서 조회해 props로 넘긴다. 클라이언트에서 서버 작업이 필요하면 Server Function(7장)을 쓴다.

```tsx
// ✅ 서버 컴포넌트에서 조회하고 결과만 넘긴다
export default async function Page() {
  const info = await getHospitalInfo();
  return <PhoneButton phone={info.phone} />;
}
```

출처: `01-getting-started/05-server-and-client-components.md`

---

## 5. 캐싱 — Cache Components (`cacheComponents: true`)

이 프로젝트는 Cache Components가 켜져 있으므로 이 장의 모델을 따른다.

### 5.1 기본 원칙

- **데이터 조회는 기본적으로 캐시되지 않는다(동적).** 무엇을 캐시할지는 개발자가 `"use cache"`로 정한다.
- 빌드 때 **정적 셸(static shell)**을 미리 렌더링해 즉시 보내고, 동적인 부분은 준비되면 스트리밍한다. 이것이 Partial Prerendering(PPR)이며 Cache Components의 기본 동작이다.
- Cache Components는 **Node.js 런타임 전용**이다. `export const runtime = ...`를 두지 않는다.

### 5.2 Cache Components에서 쓸 수 없는 라우트 세그먼트 설정

Cache Components가 켜져 있으면 다음 설정은 **제거되어 쓸 수 없다**:

- `export const dynamic` (예: `'force-dynamic'`)
- `export const revalidate`
- `export const fetchCache`
- `export const dynamicParams`

남아 있는 설정은 `runtime`(Cache Components에서는 쓰지 않음), `preferredRegion`, `maxDuration`, 그리고 Cache Components 전용 `ensureStatic`이다.

> 요청 시점 렌더링을 보장하려면 위 설정 대신 5.4절의 `<Suspense>`, `connection()`, `io()`를 쓴다.

출처: `03-api-reference/03-file-conventions/02-route-segment-config/index.md`

### 5.3 빌드 시 컴포넌트 처리 방식

| 컴포넌트가 하는 일                                                 | 처리                                                    |
| ------------------------------------------------------------------ | ------------------------------------------------------- |
| `"use cache"` 사용                                                 | 결과가 캐시되어 정적 셸에 포함(수명이 너무 짧지 않으면) |
| `<Suspense>`로 감싼 비캐시 비동기 작업                             | fallback이 정적 셸에 들어가고, 내용은 요청 시 스트리밍  |
| 모듈 import, `fs.readFileSync`, 순수 계산                          | 빌드 때 완료되어 정적 셸에 자동 포함                    |
| `Math.random()`, `Date.now()`, `new Date()`, `crypto.randomUUID()` | 명시적으로 처리해야 함(5.4절)                           |

**규칙**: 비캐시 데이터나 런타임 API를 `<Suspense>` 밖에서 쓰면 개발 오버레이에 **blocking-route** 경고가 뜨고 빌드에서 막힌다. 반드시 ① `"use cache"`로 캐시하거나 ② `<Suspense>`로 감싸야 한다.

- `<Suspense>`는 컴포넌트를 동적으로 **만들지 않는다**. 동기 작업만 하는 컴포넌트는 `<Suspense>` 안에 있어도 빌드 때 완료된다.

### 5.4 현재 시각·난수 다루기 (접속 시점 계산)

현재 시각처럼 요청마다 달라야 하는 값은 두 가지 중 하나를 고른다.

1. **요청마다 새로 계산**: `connection()` 또는 `io()`를 먼저 호출하고 `<Suspense>`로 감싼다.
2. **모두에게 같은 값 공유**: `"use cache"`로 감싼다(재검증 전까지 같은 값).

```tsx
import { connection } from "next/server";
import { Suspense } from "react";

async function Now() {
  // 요청이 들어온 뒤에만 계산되도록 한다
  await connection();
  return <p>{new Date().toISOString()}</p>;
}

export default function Page() {
  return (
    <Suspense fallback={<p>불러오는 중…</p>}>
      <Now />
    </Suspense>
  );
}
```

**`connection()`과 `io()`의 차이** (`io()`는 16.3.0 추가, `next/cache`에서 import)

|                  | `connection()` (`next/server`)                                 | `io()` (`next/cache`)                               |
| ---------------- | -------------------------------------------------------------- | --------------------------------------------------- |
| 정적 셸에서 제외 | 예                                                             | 예                                                  |
| 프리페치         | 실제 사용자 요청이 서버에 올 때까지 대기 → **프리페치를 막음** | 일반 비동기처럼 동작 → 뒤 코드를 캐시·프리페치 가능 |
| 문서 권장        | 실제 사용자 요청을 기다려야 할 때만                            | Cache Components에서 정적 셸 제외용으로 우선 사용   |

- `cookies()`·`headers()`를 이미 쓰거나, `<Suspense>` 안에서 `await fetch`·비동기 DB 조회를 하면 그 자체가 중단 지점이므로 `io()`가 필요 없다.
- 동기 DB 드라이버(`better-sqlite3`, `node:sqlite`)는 빌드 때 실행되어 버리므로, 요청별 데이터가 필요하면 조회 전에 `connection()`/`io()`를 호출한다.

출처: `01-getting-started/08-caching.md`, `03-api-reference/04-functions/connection.md`, `03-api-reference/04-functions/io.md`

### 5.5 `"use cache"` 규칙

- 함수·컴포넌트 본문 맨 위, 또는 파일 맨 위에 둔다. **캐시되는 함수는 반드시 `async`**다. 파일 맨 위에 두면 모든 export가 캐시 대상이 되어 전부 async여야 한다.
- **모든 `"use cache"`에 `cacheLife`를 함께 쓰는 것을 권장**한다. 없으면 `default` 프로필(stale 5분, revalidate 15분, expire 없음)이 적용된다.
- **캐시 키** = 빌드 ID + 함수 ID + 직렬화된 인자 + (개발 시) HMR 해시. 바깥 스코프에서 참조한 변수도 자동으로 키에 포함된다.
- **인자·반환값은 직렬화 가능**해야 한다. 클래스 인스턴스, 함수(통과만 하는 경우 제외), Symbol, URL 인스턴스는 안 된다. JSX는 반환값으로는 되지만 인자로는 통과용으로만 된다.
- **캐시 스코프 안에서 `cookies()`, `headers()`, `searchParams`를 읽을 수 없다.** 호출 스택 전체에 적용된다(캐시 함수가 부른 헬퍼도 금지). 바깥에서 읽어 **값을 인자로** 넘긴다.
  - 동적 라우트에서는 이 오류가 `next build`는 통과하고 `next start`에서 터질 수 있다.
- `React.cache`로 저장한 값은 `"use cache"` 안에서 보이지 않는다. 인자로 넘긴다.
- 캐시 함수 안에서 바깥에서 만든 런타임 데이터 Promise를 기다리면 빌드가 50초 후 타임아웃된다.
- Route Handler 본문에 직접 `"use cache"`를 쓸 수 없다. 헬퍼 함수로 뺀다.
- 서버리스(Vercel 등)에서는 기본 메모리 캐시가 요청 간에 유지되지 않을 수 있다. 빌드 시 캐시는 정상 동작한다. 새 배포마다 캐시는 초기화된다.
- 클라이언트 라우터는 `stale` 설정과 관계없이 **최소 30초** 캐시를 유지한다.
- 디버깅: `NEXT_PRIVATE_DEBUG_CACHE=1`.

```ts
import { cacheLife, cacheTag } from "next/cache";

export async function getHospitalInfo() {
  "use cache";
  cacheLife("max");
  cacheTag("hospital-info");
  // 조회 코드
}
```

출처: `03-api-reference/01-directives/use-cache.md`

### 5.6 수명(`cacheLife`)과 재검증

| 프로필    | stale | revalidate | expire |
| --------- | ----- | ---------- | ------ |
| `default` | 5m    | 15m        | 없음   |
| `seconds` | 30s   | 1s         | 60s    |
| `minutes` | 5m    | 1m         | 1h     |
| `hours`   | 5m    | 1h         | 1d     |
| `days`    | 5m    | 1d         | 1w     |
| `weeks`   | 5m    | 1w         | 30d    |
| `max`     | 5m    | 30d        | 1y     |

- **짧은 수명**(`seconds` 프로필, `revalidate: 0`, `expire` 5분 미만)은 정적 셸에서 자동 제외되어 동적 구멍이 된다.
- 수명 지정 없는 캐시 안에 짧은 수명 캐시를 중첩하면 빌드가 실패한다.
- CMS처럼 시간이 아니라 변경 시점에 갱신할 데이터는 `cacheTag` + 긴 `cacheLife`(`max`)로 두고, 변경 알림(웹훅 등)에서 `revalidateTag`를 호출한다.

|           | `updateTag`                     | `revalidateTag`              | `revalidatePath`                 |
| --------- | ------------------------------- | ---------------------------- | -------------------------------- |
| 호출 위치 | Server Action만                 | Server Action, Route Handler | Server Action, Route Handler     |
| 동작      | 즉시 만료(내가 쓴 값을 바로 봄) | stale-while-revalidate       | 경로 단위 무효화                 |
| 문서 권장 | 사용자가 변경을 즉시 봐야 할 때 | 약간의 지연이 허용될 때      | 태그를 모를 때만(태그 방식 우선) |

- `refresh()`(`next/cache`)는 클라이언트 라우터만 새로 고치며 태그 데이터는 재검증하지 않는다.

출처: `01-getting-started/09-revalidating.md`

### 5.7 Partial Prefetching (`partialPrefetching: true`)

- **`cacheComponents` 없이 켜면 `next dev`·`next build`가 설정 검증에서 오류를 낸다.** 두 옵션은 함께 다룬다.
- 설정하지 않으면 `false`처럼 동작하며 `cacheComponents`가 켜져 있으면 경고를 낸다. 다음 메이저 버전에서 두 기능이 기본이 되고 옵션은 제거될 예정이다.
- 켜면 링크마다가 아니라 **경로마다 하나의 App Shell**을 프리페치해 재사용한다. URL별 내용(`params`, `searchParams`)은 이동 후에 채워진다.
- `<Link prefetch={true}>`를 쓰면 URL 데이터와 그 뒤의 캐시 내용까지 미리 가져온다(링크마다 서버 호출 비용 발생).
- `cookies()`·`headers()`를 읽는 경로의 App Shell은 세션별로 클라이언트에 캐시된다.
- 세그먼트에서 `prefetch`를 export하면 앱 전체 기본값을 덮어쓴다.

출처: `03-api-reference/05-config/01-next-config-js/partialPrefetching.md`, `03-api-reference/05-config/01-next-config-js/cacheComponents.md`

### 5.8 `ensureStatic` (16.4.0 추가, Cache Components 전용)

페이지나 레이아웃에서 export해, 지정한 단계의 출력이 **반드시 정적이도록** 강제한다.

| 값             | 정적이어야 하는 출력                                     |
| -------------- | -------------------------------------------------------- |
| `'auto'`(기본) | 추가 요구 없음                                           |
| `'shell'`      | App Shell                                                |
| `'prefetch'`   | App Shell + 링크별 프리페치                              |
| `'navigation'` | 서버 렌더링 결과 전체                                    |
| `false`        | 정적 요구를 막음(다른 세그먼트가 위 값을 쓰면 빌드 실패) |

- `cacheComponents`가 꺼져 있으면 빌드 실패. 클라이언트 컴포넌트에서 export하면 에러.
- 하위 세그먼트는 더 엄격한 값만 쓸 수 있다. 더 약한 값을 쓰면 빌드 실패.
- `'navigation'`에서는 `<Suspense>` 안이라도 비캐시 데이터, `connection()`, 런타임 API, 짧은 수명 캐시가 모두 검증 실패다.

출처: `03-api-reference/03-file-conventions/02-route-segment-config/ensureStatic.md`

### 5.9 Activity로 화면 상태 유지

- Cache Components가 켜져 있으면 이동할 때 이전 경로를 언마운트하지 않고 React `<Activity>`로 **숨긴다**. 돌아오면 입력값 등 상태가 그대로 있다.
- 숨겨질 때 Effect는 정리되고, 다시 보일 때 재실행된다.
- 드롭다운·다이얼로그처럼 언마운트를 전제로 한 UI는 동작이 달라질 수 있다(`02-guides/preserving-ui-state.md` 참고).

### 5.10 봇·크롤러

- 일부 봇은 메타데이터가 `<head>`에 있어야 하므로 Next.js가 User-Agent로 판별해 정적 셸 없이 요청 시점에 전부 렌더링해 보낸다.
- 빌드 때 쓸 수 있던 데이터 소스는 요청 시에도 쓸 수 있어야 한다. 아니면 봇이 500을 받는다.

---

## 6. 데이터 가져오기와 스트리밍

- 서버 컴포넌트는 `async`로 만들고 `fetch`나 ORM/DB 조회를 직접 `await`한다. DB 자격 증명은 클라이언트로 가지 않는다(인증·권한 확인은 여전히 필요).
- 같은 `fetch` 요청은 한 렌더링 안에서 자동으로 중복 제거된다. `fetch`가 아닌 DB 조회는 `React.cache`로 감싸 한 요청 안에서 결과를 공유한다(요청 간 공유 아님).
- `fetch`는 기본적으로 캐시되지 않는다. 캐시하려면 `"use cache"`, 매 요청 새로 받으려면 `<Suspense>`.
- `fetch`의 `cache: 'force-cache' | 'no-store'`, `next.revalidate`, `next.tags` 옵션은 Cache Components를 켠 뒤에도 계속 동작한다. 다만 Cache Components의 캐시 모델은 `"use cache"` + `cacheLife`/`cacheTag`이므로 새 코드는 이 방식을 쓴다. `revalidate`와 `cache: 'no-store'`처럼 충돌하는 옵션을 함께 주면 둘 다 무시된다.
- **순차 요청을 피한다.** 독립적인 요청은 먼저 시작하고 `Promise.all`(또는 실패 허용 시 `Promise.allSettled`)로 기다린다.
- **스트리밍 방법 두 가지**
  - `loading.js`: 페이지 전체를 `<Suspense>`로 감싼다.
  - `<Suspense>`: 원하는 부분만 감싼다. **데이터 접근 가까이에 `<Suspense>`를 두는 것이 권장**된다.
- **레이아웃에서 비캐시·런타임 데이터를 읽으면 같은 세그먼트의 `loading.js`가 감싸 주지 못한다**(`loading`이 `layout` 아래에 있으므로). 레이아웃 안에서 따로 `<Suspense>`로 감싸거나 데이터 조회를 `page`로 옮긴다. Cache Components에서는 이를 빌드 에러로 알려 준다.
- 비동기 작업을 트리 깊은 곳에 둘수록 정적 셸이 커진다. 레이아웃 상단에서 `params`를 `await`하지 말고 Promise를 아래로 넘겨 필요한 곳에서 `await`한다.
- 클라이언트에서 데이터가 필요하면: 서버에서 만든 Promise를 prop으로 넘기고 클라이언트에서 `use()`로 읽거나, SWR·React Query를 쓴다.

출처: `01-getting-started/06-fetching-data.md`, `01-getting-started/08-caching.md`, `03-api-reference/04-functions/fetch.md`, `02-guides/migrating-to-cache-components.md`

---

## 7. 데이터 변경 — Server Functions / Server Actions

- `"use server"`를 async 함수 본문 맨 위 또는 파일 맨 위에 둔다.
- **클라이언트 컴포넌트 안에서는 정의할 수 없다.** `"use server"` 파일에서 import해 쓰거나 prop으로 받는다.
- 호출: `<form action={...}>`, `<button formAction={...}>`, 이벤트 핸들러, `useEffect`.
- 내부적으로 `POST`로만 호출된다. **UI를 거치지 않고 직접 POST로도 호출될 수 있으므로 함수마다 인증·권한을 확인한다.**
- 클라이언트는 Server Function을 **하나씩 순서대로** 보낸다. 병렬 데이터 조회 용도로 쓰지 않는다.
- 진행 상태 표시는 `useActionState`의 `pending`을 쓴다. 제출 버튼을 별도 컴포넌트로 뺄 때는 React의 `useFormStatus`(`react-dom`)도 쓸 수 있다(그 컴포넌트가 `<form>` 안에 렌더링되어야 한다).
- 변경 후: `refresh()`(화면만 새로 고침), `revalidateTag`/`updateTag`/`revalidatePath`(캐시 무효화), `redirect()`.
- `redirect()`는 예외를 던지므로 **뒤의 코드는 실행되지 않는다.** 재검증은 `redirect()` 전에 한다.
- Server Action에서 쿠키를 설정·삭제하면 현재 페이지와 레이아웃이 서버에서 다시 렌더링된다.

출처: `01-getting-started/07-mutating-data.md`, `02-guides/forms.md`

---

## 8. 에러 처리와 404

### 8.1 예상된 에러

- 폼 검증 실패처럼 예상 가능한 에러는 **throw하지 말고 반환값으로** 모델링한다. 클라이언트에서 `useActionState`로 표시한다.
- 서버 컴포넌트에서 응답 실패는 조건부 렌더링이나 `redirect()`로 처리한다.

### 8.2 예상하지 못한 에러

- `error.js`로 세그먼트 단위 에러 경계를 만든다. 에러는 가장 가까운 상위 경계로 올라간다.
- 컴포넌트 단위 경계는 `catchError`(`next/error`)로 만든다.
- 에러 경계는 **이벤트 핸들러·비동기 코드의 에러를 잡지 않는다.** 직접 잡아 `useState` 등으로 표시한다. 단, `useTransition`의 `startTransition` 안에서 처리되지 않은 에러는 에러 경계로 올라간다.
- `global-error.js`는 루트 레이아웃을 대체하므로 자체 `<html>`, `<body>`가 있어야 한다.

### 8.3 404 (`not-found.js`, `global-not-found.js`)

- `notFound()`를 호출하면 그 세그먼트의 `not-found.js`가 렌더링된다.
- **스트리밍 시작 전이면 404 상태 코드, 시작 후면 200 상태 코드**로 응답한다. 두 경우 모두 `<meta name="robots" content="noindex">`가 자동으로 들어간다.
- 루트 `app/not-found.js`는 앱 전체의 일치하지 않는 URL도 처리한다.
- **`global-not-found.js`(실험적)**: 어떤 경로와도 일치하지 않는 URL에 대해 렌더링을 건너뛰고 이 페이지를 바로 돌려준다.
  - 쓰는 경우: **루트 레이아웃이 여러 개**라 하나의 레이아웃으로 404를 만들 수 없을 때, 또는 루트 레이아웃이 최상위 동적 세그먼트 아래에 있을 때.
  - 켜기: `next.config.ts`의 `experimental.globalNotFound: true` + `app/global-not-found.tsx`.
  - 레이아웃을 거치지 않으므로 **전역 CSS·폰트·테마를 이 파일에서 직접 import**하고, `<html>`, `<body>`를 포함한 완전한 HTML 문서를 반환해야 한다.
- `not-found`와 `global-not-found`는 props를 받지 않는다. 둘 다 `metadata`/`generateMetadata`를 export할 수 있다.

### 8.4 401·403 (`unauthorized()`, `forbidden()`) — 실험적

- `next.config.ts`에 `experimental.authInterrupts: true`를 켜야 쓸 수 있다. **이 프로젝트는 켜지 않았다.**
- `unauthorized()`는 401(로그인 안 됨), `forbidden()`은 403(권한 없음) 화면을 렌더링한다. UI는 `unauthorized.tsx`, `forbidden.tsx`로 정한다.
- 서버 컴포넌트, Server Function, Route Handler에서 호출한다. **루트 레이아웃에서는 호출할 수 없다.**
- `notFound()`처럼 **예외를 던진다.** `return`을 붙일 필요가 없고, `try/catch`로 감싸면 화면이 나오지 않는다(`unstable_rethrow`로 통과시킨다). `await`하지 않은 Promise 안에서 호출하면 아무도 잡지 못해 화면이 나오지 않는다.
- 상태 코드는 404와 같다: 스트리밍 시작 전 호출이면 401/403, 시작 후면 200. 두 경우 모두 `noindex`가 들어간다.

> 관리자 인증은 Payload가 담당한다. 공개 사이트에서 이 함수가 필요한지는 확인되지 않았다.

출처: `01-getting-started/10-error-handling.md`, `03-api-reference/03-file-conventions/not-found.md`, `03-api-reference/04-functions/unauthorized.md`, `03-api-reference/04-functions/forbidden.md`, `03-api-reference/05-config/01-next-config-js/authInterrupts.md`

---

## 9. 메타데이터와 viewport

- `metadata` 객체와 `generateMetadata` 함수는 **서버 컴포넌트에서만** export할 수 있다.
- `charset`, `viewport` meta 태그는 기본으로 자동 추가된다.
- 데이터에 따라 달라지는 메타데이터는 `generateMetadata`를 쓴다. 페이지와 같은 데이터를 쓰면 `React.cache`로 한 번만 조회한다.
- 동적으로 렌더링되는 페이지는 메타데이터를 **스트리밍**한다. 단, 메타데이터를 `<head>`에서 기대하는 봇(Twitterbot, Slackbot, Bingbot 등)에는 스트리밍하지 않는다(`htmlLimitedBots`로 조정).
- 파일 기반 메타데이터: `favicon.ico`, `icon`, `apple-icon`, `opengraph-image`, `twitter-image`, `robots`, `sitemap`. 하위 폴더의 파일이 상위 파일보다 우선한다.
- OG 이미지 생성(`ImageResponse`, `next/og`)은 flexbox와 일부 CSS만 지원한다(`display: grid` 불가).
- **viewport**(`themeColor` 등)는 `metadata`가 아니라 별도 `viewport` 객체나 `generateViewport`로 export한다. **요청 정보에 의존하지 않으면 정적 `viewport` 객체를 쓴다.**
- Cache Components에서 `generateMetadata`·`generateViewport`도 페이지와 같은 규칙을 따른다(런타임 데이터·비캐시 조회는 요청 시점으로 미뤄짐).

출처: `01-getting-started/14-metadata-and-og-images.md`, `03-api-reference/04-functions/generate-viewport.md`

---

## 10. Route Handlers와 Proxy

### 10.1 Route Handlers (`route.ts`)

- Web `Request`/`Response` API를 쓴다. 지원 메서드: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, `OPTIONS`. 그 외는 405.
- **같은 세그먼트에 `page`와 `route`를 함께 둘 수 없다.**
- Route Handler는 레이아웃·클라이언트 이동에 참여하지 않는다.
- Cache Components에서 `GET` 핸들러는 페이지와 같은 모델을 따른다: 런타임·비캐시 데이터를 쓰지 않으면 빌드 때 프리렌더링된다. `request.url`, `request.headers`, `cookies()`, `connection()`, DB 조회 등을 쓰면 요청 시점으로 넘어간다.
- 타입은 전역 헬퍼 `RouteContext<'/경로'>`.

### 10.2 Proxy (`proxy.ts`, 구 middleware)

- 프로젝트 루트 또는 `src` 안에 **하나만** 둔다(`app`과 같은 위치). 내용은 다른 파일로 나눠 import할 수 있다.
- 용도: 헤더 수정, A/B 리라이트, 요청 정보에 따른 리다이렉트.
- **단순 리다이렉트는 `next.config.ts`의 `redirects`를 먼저 쓴다.**
- 느린 데이터 조회에 쓰지 않는다. 낙관적 권한 확인 정도만 하고, 완전한 세션·권한 관리 수단으로 쓰지 않는다.
- Proxy 안의 `fetch` 캐시 옵션(`cache`, `next.revalidate`, `next.tags`)은 효과가 없다.
- `matcher`로 실행 경로를 제한한다.
- **런타임은 `nodejs` 고정이며 설정할 수 없다.** edge 런타임이 꼭 필요하면 폐기 예정인 `middleware`를 계속 써야 한다(1.2절).

### 10.3 응답 뒤 작업 (`after()`)

- `after(callback)`(`next/server`)은 응답(또는 프리렌더)이 끝난 뒤 콜백을 실행한다. 로그·분석처럼 응답을 막지 않아야 하는 작업에 쓴다.
- 서버 컴포넌트(`generateMetadata` 포함), Server Function, Route Handler, Proxy에서 쓸 수 있다.
- `after`는 런타임 API가 아니어서 경로를 동적으로 만들지 않는다. **정적 페이지에서 쓰면 콜백이 빌드 때나 재검증 때 실행된다.**
- 응답이 실패해도(에러, `notFound`, `redirect`) 실행된다.
- `cookies()`·`headers()` 사용
  - Route Handler·Server Function: 콜백 안에서 바로 읽을 수 있다.
  - **서버 컴포넌트: 콜백 안에서 읽으면 런타임 에러.** 렌더링 중에 읽어 둔 값을 콜백에 넘긴다. Cache Components에서는 그 컴포넌트를 `<Suspense>`로 감싼다.
- 실행 시간은 경로의 `maxDuration` 안이다.

```ts
import { after } from "next/server";

export async function POST(request: Request) {
  const result = await save(await request.json());
  // 응답을 먼저 보내고 로그는 나중에 남긴다
  after(async () => {
    await logEvent(result.id);
  });
  return Response.json({ id: result.id });
}
```

출처: `01-getting-started/15-route-handlers.md`, `01-getting-started/16-proxy.md`, `02-guides/upgrading/version-16.md`, `03-api-reference/04-functions/after.md`

---

## 11. 링크와 내비게이션

- 경로 이동은 `next/link`의 `<Link>`를 기본으로 쓴다. 고급 이동은 `useRouter`.
- `<Link>`는 화면에 보이면 자동으로 프리페치한다(Partial Prefetching 동작은 5.7절).
- 동적 경로에는 `loading.tsx`를 두어 즉시 이동·로딩 표시가 되게 한다.
- 동적 세그먼트를 빌드 때 만들 수 있으면 `generateStaticParams`를 쓴다.
- 느린 네트워크 대비: `useLinkStatus`로 이동 중 표시(짧은 지연 후 보이게 하면 깜빡임 방지).
- 많은 링크 목록에서는 `prefetch={false}`나 hover 시 프리페치를 고려한다.
- 고정 헤더 뒤로 내용이 가려지면 CSS `scroll-padding-top`으로 보정한다.
- `window.history.pushState`/`replaceState`는 Next.js 라우터와 연동된다(`usePathname`, `useSearchParams`와 동기화).

### 11.1 타입 안전 링크 (`typedRoutes`)

- `next.config.ts`의 최상위 `typedRoutes: true`로 켠다(안정화됨, `experimental.typedRoutes` 아님). TypeScript가 필요하다.
- 켜면 `.next/types`에 경로 정의가 생성되어, `next/link`의 `href`와 `next/navigation`의 `push`·`replace`·`prefetch`에서 **없는 경로를 쓰면 타입 에러**가 난다.
- 문자열 리터럴 `href`만 검사된다. 변수로 만든 `href`는 `as Route` 캐스팅이 필요할 수 있다.
- **이 프로젝트는 아직 켜지 않았다.** 메뉴 경로를 상수 파일 한 곳에 두는 방식과 함께 쓸지는 사용자에게 확인한다.

출처: `01-getting-started/04-linking-and-navigating.md`, `03-api-reference/05-config/01-next-config-js/typedRoutes.md`, `03-api-reference/05-config/02-typescript.md`

---

## 12. CSS · 이미지 · 폰트

### 12.1 CSS

- 전역 CSS와 Tailwind는 **루트 레이아웃에서 import**한다.
- 전역 스타일은 이동해도 제거되지 않아 충돌할 수 있으므로 **정말 전역인 CSS만** 전역 파일에 둔다.
- 문서 권장: 대부분 Tailwind, 부족할 때 CSS Modules(`*.module.css`).
- CSS 순서는 **import 순서**를 따른다. import 자동 정렬 린트 규칙(`sort-imports` 등)은 끈다.
- 개발과 프로덕션에서 CSS 순서가 다를 수 있으니 최종 순서는 `next build` 결과로 확인한다.

### 12.2 이미지 (`next/image`)

- 정적 import한 로컬 이미지는 `width`/`height`가 자동으로 정해진다.
- 원격 이미지는 `width`, `height`를 직접 넣고, `next.config.ts`의 `images.remotePatterns`에 **가능한 한 구체적으로** 허용 패턴을 등록한다.
- 16의 기본값 변경은 1.2절 참고.

### 12.3 폰트 (`next/font`)

- `next/font/google`, `next/font/local`은 폰트를 자체 호스팅한다(브라우저가 Google로 요청하지 않음).
- 가변 폰트를 권장한다. 가변 폰트가 아니면 `weight`를 지정한다.
- 앱 전체에 적용하려면 루트 레이아웃에서 쓴다.
- `localFont`의 `src`는 호출한 파일 기준 상대 경로다.

출처: `01-getting-started/11-css.md`, `01-getting-started/12-images.md`, `01-getting-started/13-fonts.md`

---

## 13. 환경변수

- `.env*` 파일을 `process.env`로 자동으로 읽는다. `src` 폴더를 써도 `.env*`는 **프로젝트 루트**에 둔다.
- **기본적으로 서버에서만** 쓸 수 있다. 브라우저에 노출하려면 `NEXT_PUBLIC_` 접두어가 필요하며, 이 값은 **빌드 시점에 번들에 고정**된다(배포 후 바꿔도 반영되지 않음).
- `process.env[name]` 같은 동적 조회는 인라인되지 않는다.
- 런타임에 환경변수를 읽어야 하면 동적 렌더링 중에 읽는다. 빌드 때 고정되지 않게 하려면 `connection()` 후에 읽는다.
- 조회 순서: `process.env` → `.env.$(NODE_ENV).local` → `.env.local`(test 제외) → `.env.$(NODE_ENV)` → `.env`.
- Next.js 런타임 밖(ORM 설정, 테스트 러너 등)에서는 `@next/env`의 `loadEnvConfig`로 읽는다.

출처: `02-guides/environment-variables.md`, `02-guides/upgrading/version-16.md`

---

## 14. `next.config.ts`

- 현재 설정을 유지한다: `withPayload(nextConfig)` 래퍼, `experimental.agentFeedback`, `cacheComponents`, `partialPrefetching`, 최상위 `turbopack.rules`(Tailwind 로더). 바꾸기 전에 사용자에게 확인한다.
- Turbopack 설정은 **최상위 `turbopack`**에 둔다. `experimental.turbo`/`experimental.turbopack`은 쓰지 않는다.
- `webpack` 설정을 추가하면 `next build`(Turbopack 기본)가 실패한다(1.2절).
- `experimental.optimizePackageImports`는 실험적 옵션이다. `lucide-react`, `date-fns`, `lodash-es` 등은 **이미 기본으로 최적화**되므로 추가하지 않는다.
- 헤더는 `headers()`, 단순 리다이렉트는 `redirects()`에 둔다(10.2절).
- 실험적 옵션(`globalNotFound`, `authInterrupts` 등)을 켜는 것은 프로젝트 결정이다. 사용자 확인 없이 추가하지 않는다.

출처: `02-guides/upgrading/version-16.md`, `03-api-reference/05-config/01-next-config-js/optimizePackageImports.md`

---

## 15. 이 프로젝트에 바로 적용되는 사항

공식 문서 내용을 현재 코드·결정에 맞춰 짚은 것이다. 결정은 프로젝트 문서를 따른다.

1. **`export const dynamic = 'force-dynamic'`은 쓸 수 없다.** `cacheComponents: true`에서 제거된 설정이다(5.2절). 접속 시점 계산은 `<Suspense>` + `connection()`/`io()`로 한다(5.4절). 어떤 방식을 쓸지는 아직 정하지 않았다.
2. **루트 레이아웃이 두 개**(`(frontend)`, `(payload)`)다. 둘 사이를 이동하면 전체 페이지를 새로 불러온다. 공통 404에는 `global-not-found.js`(실험적)가 적용 대상 조건에 해당한다(8.3절).
3. **`themeColor`는 정적 `viewport` 객체로 둔다.** 요청 정보에 의존하지 않으므로 문서 권장과 맞는다(9장).
4. **`pnpm lint`는 ESLint CLI**이며 `next build`는 린트를 하지 않는다(1.2절). 둘 다 따로 돌린다.
5. **헤더(예: `X-Robots-Tag`)는 `next.config.ts`의 `headers()`**로 넣는다. 단순 리다이렉트도 `redirects`가 먼저다(10.2절).
6. **`revalidateTag`는 두 번째 인자가 필수**다. Payload 변경 후 재검증 코드를 쓸 때 주의한다(5.6절).

---

## 16. 작업 후 확인 명령

패키지 매니저는 **pnpm**만 쓴다(`npm install` 금지).

| 명령                | 내용                                                                                                             |
| ------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `pnpm lint`         | ESLint CLI. `next build`는 린트를 하지 않으므로 따로 돌린다                                                      |
| `pnpm build`        | 프로덕션 빌드. 프로젝트의 `tsc`로 **타입 검사도 함께** 한다. 캐싱 규칙 위반(blocking-route 등)도 여기서 드러난다 |
| `pnpm next typegen` | `PageProps`·`LayoutProps`·`RouteContext` 타입만 다시 생성할 때                                                   |

- 프로젝트에 `typecheck`, `format:check`, `check-all` 스크립트는 **없다.** 필요하면 추가 여부를 사용자에게 확인한다.
- 빌드가 통과해도 실행 동작은 따로 확인한다(업그레이드 체크리스트: "A green build alone does not close runtime findings"). 캐시 함수 안에서 런타임 API를 쓰면 `next build`는 통과하고 `next start`에서 실패할 수 있다(5.5절).

출처: `02-guides/upgrading/version-16.md`, `03-api-reference/05-config/02-typescript.md`

---

## 참고한 공식 문서 목록

모두 `node_modules/next/dist/docs/01-app/` 기준.

- `02-guides/upgrading/version-16.md`
- `01-getting-started/02-project-structure.md`
- `01-getting-started/03-layouts-and-pages.md`
- `01-getting-started/04-linking-and-navigating.md`
- `01-getting-started/05-server-and-client-components.md`
- `01-getting-started/06-fetching-data.md`
- `01-getting-started/07-mutating-data.md`
- `01-getting-started/08-caching.md`
- `01-getting-started/09-revalidating.md`
- `01-getting-started/10-error-handling.md`
- `01-getting-started/11-css.md`
- `01-getting-started/12-images.md`
- `01-getting-started/13-fonts.md`
- `01-getting-started/14-metadata-and-og-images.md`
- `01-getting-started/15-route-handlers.md`
- `01-getting-started/16-proxy.md`
- `02-guides/environment-variables.md`
- `03-api-reference/01-directives/use-cache.md`
- `03-api-reference/03-file-conventions/layout.md`
- `03-api-reference/03-file-conventions/not-found.md`
- `03-api-reference/03-file-conventions/02-route-segment-config/index.md`
- `03-api-reference/03-file-conventions/02-route-segment-config/ensureStatic.md`
- `03-api-reference/04-functions/connection.md`
- `03-api-reference/04-functions/io.md`
- `03-api-reference/04-functions/generate-viewport.md`
- `03-api-reference/05-config/01-next-config-js/cacheComponents.md`
- `03-api-reference/05-config/01-next-config-js/partialPrefetching.md`
- `03-api-reference/03-file-conventions/parallel-routes.md`
- `03-api-reference/03-file-conventions/intercepting-routes.md`
- `03-api-reference/04-functions/after.md`
- `03-api-reference/04-functions/fetch.md`
- `03-api-reference/04-functions/forbidden.md`
- `03-api-reference/04-functions/unauthorized.md`
- `03-api-reference/05-config/01-next-config-js/authInterrupts.md`
- `03-api-reference/05-config/01-next-config-js/optimizePackageImports.md`
- `03-api-reference/05-config/01-next-config-js/typedRoutes.md`
- `03-api-reference/05-config/02-typescript.md`
- `02-guides/forms.md`
- `02-guides/migrating-to-cache-components.md`
