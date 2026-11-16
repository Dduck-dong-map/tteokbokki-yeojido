# 떡볶여지도 디자인 시스템

웹접근성(WCAG 2.2 AA)을 기준으로 만든 디자인 시스템. 구조는 Material 3 를 따르고, 색은 팔레트 P3 「어묵국물 · 옥빛 버튼」(바탕만 #F3F1EE), 글꼴은 제목 조선100년체 · 본문 Pretendard (11-13 수정판, 맨 아래 「수정판 기록」).

| 파일 | 내용 |
|---|---|
| [README.md](README.md) | 사용 규칙 (이 문서): 토큰 구조, 색, 치수, 글자, 말투, 로고 |
| [tokens.json](tokens.json) | **토큰 원본** — 색 129 (Primitive 79 · Semantic 50) · 간격 · 모서리 · 글자 · 그림자 · 크기 |
| [accessibility.md](accessibility.md) | 웹접근성 기준과 대비 표 (61쌍 × 3테마) |
| [logos.md](logos.md) | 로고(호랑이)와 이름 글씨 |
| [components/](components/) | 부품 8개의 쓰임새 (Button · Fab · FilterChip · TextField · SpicyStamp · StoreListItem · NavigationBar · Snackbar) |
| [assets/](assets/) | 글꼴을 쓸 수 없는 곳용 이름 글씨 그림 |

### 코드와의 연결

```
docs/design-system/tokens.json ──(pnpm tokens = scripts/build-tokens.mjs)──▶ src/app/tokens.css ──▶ src/app/globals.css (shadcn 변수 → Semantic 토큰)
```

- 토큰을 고칠 때는 `tokens.json` 만 고치고 `pnpm tokens` 를 돌린다. `src/app/tokens.css` 는 손으로 고치지 않는다.
- 글꼴 파일: `src/app/fonts/ChosunCentennial.woff2`(눈누 변환본 — 아래 4절 「11-13 원문 확인」) · `TteokWordmark.woff2`(을지로10년후체에서 「떡볶여지도」만 남긴 서브셋, OFL 사용 허락서 `src/app/fonts/OFL-TteokWordmark.txt`) · Pretendard(npm `pretendard`, OFL), 불러오기는 `src/app/layout.tsx`.
- 테마: `<html>` 에 `class="dark"` 또는 `data-theme="dark"` · `data-theme="hc"`(고대비). 기본은 밝게.
- 지도(MapLibre)는 CSS 변수를 못 읽어 `src/lib/theme.ts` 에 같은 P3 값을 둔다. 색을 바꾸면 여기도 맞춘다.
- 부품 미리보기와 브랜드 북 화면: Claude 디자인 「떡볶여지도」 디자인 시스템 (https://claude.ai/artifact/MtL8cQEtr3fNf4avBNE7vZ, 비공개). 이 폴더와 내용이 같다.

---

떡 종류·맵기 취향으로 분식집을 찾는 지도. 화면은 **지도 종이 위에 옥빛 버튼 하나, 구운 갈색 강조 하나**로 조용하게 두고, 색이 시끄러워지는 건 맵기 도장뿐이다. 토큰은 **Primitive → Semantic** 2층이고, 모든 결정은 [웹접근성 기준](accessibility.md)을 먼저 통과해야 한다.

## 토큰 구조

| 층 | 무엇 | 이름 | 쓰는 곳 |
|---|---|---|---|
| 1. Primitive 색 | 색 단계표 50~950 | `neutral-100`, `jade-600` … | **화면 코드에서 직접 쓰지 않는다.** Semantic 이 참조한다 |
| 2. Semantic 색 | 역할 이름 | `background-primary`, `text-secondary`, `interactive-primary-hover` … | 화면·부품은 이것만 쓴다 |
| 3. Primitive 치수 | 간격·모서리 | `space-16`, `radius-12` … (이름 = px) | 그대로 쓴다 |
| 4. Typography | Primitive 4종 + Semantic 스타일 | `font-size-36` → `heading-1` | 스타일 변수(`--heading-1-font-size`)나 Tailwind `text-heading-1` |

규칙: 테마(밝게·어둡게·고대비)가 바뀌면 **Semantic 이 가리키는 Primitive 만 바뀐다**. 그래서 화면 코드는 테마를 몰라도 된다.

## 1. Primitive 색

P3 「어묵국물 · 옥빛 버튼」의 원래 색을 각 단계표의 **밝기가 가장 가까운 칸에 그대로 고정**하고, 나머지 칸은 업계 표준(Tailwind) 단계별 밝기에 맞춰 만들었다.

| 단계표 | 고정한 원래 색 | 뜻 |
|---|---|---|
| `neutral` | 50 = #FEFEFE (면) · **100 = #F3F1EE (바탕)** · 900 = #2D2D2D (글자) | 지도 종이 회색 |
| `jade` | **600 = #2A6159** | 옥빛, 주 버튼 |
| `broth` | **500 = #A45A2A** | 어묵국물 구운 갈색, 강조·링크 |
| `bark` | **600 = #6E5436** | 제보 갈색 |
| `red` | 600 = #B3261E | 오류 |
| `blue` | 300 = #AFC3D9 (물) · 600 = #2D5B9A (내 위치) | 쪽빛 |
| `chili-1`~`5` | #F2B78C · #E3814D · #C8102E · #8E0B1F · #4A0710 | 맵기 도장 (기획안 v5 고정값) |

그 밖에 `white`, `black`, `chili-3-deep`(고대비 3단계), `chili-ink`·`chili-cream`(도장 위 글자).

## 2. Semantic 색

| 묶음 | 토큰 | 밝게 → Primitive |
|---|---|---|
| 바탕 | `background-primary` · `background-secondary` · `background-tertiary` | neutral-100 · neutral-50 · neutral-200 |
| | `background-inverse` · `background-brand` · `background-error` | neutral-900 · jade-100 · red-50 |
| 글자 | `text-primary` · `text-secondary` · `text-disabled` | neutral-900 · neutral-700 · neutral-400 |
| | `text-inverse` · `text-inverse-action` · `text-brand` · `text-error` | neutral-100 · jade-300 · jade-600 · red-600 |
| | `text-on-interactive` · `text-on-secondary` · `text-on-accent` | white · jade-950 · white |
| 링크 | `text-link` → `-hover` → `-active` | broth-500 → 600 → 700 |
| 아이콘 | `icon-primary` · `icon-secondary` · `icon-disabled` · `icon-on-interactive` · `icon-location` | neutral-900 · neutral-600 · neutral-400 · white · blue-600 |
| 테두리 | `border-default` · `border-strong` · `border-focus` · `border-error` | neutral-300 · neutral-600 · jade-700 · red-600 |
| 주 행동 | `interactive-primary` → `-hover` → `-active` | jade-600 → 700 → 800 |
| 두 번째 행동 | `interactive-secondary` → `-hover` → `-active` | jade-100 → 200 → 300 |
| 제보 | `interactive-accent` → `-hover` → `-active` | bark-600 → 700 → 800 |
| 투명 버튼·칸 | `interactive-ghost-hover` · `interactive-ghost-active` | neutral-200 · neutral-300 |
| 쓸 수 없음 | `interactive-disabled` | neutral-200 |
| 지도·맵기 | `map-water` · `spicy-1`~`5` · `text-on-spicy-low`(1·2) · `text-on-spicy-high`(3~5) | blue-300 · chili-* |
| 막 | `overlay-scrim` | black 40% |

사용 규칙:
- 화면 바탕은 `background-primary`, 카드·시트·검색창은 `background-secondary`, 입력칸·칩·아래 막대는 `background-tertiary`.
- **`interactive-primary`(옥빛)는 화면마다 주 행동 하나에만**: 「길찾기」, 선택된 칩, 활성 탭. 두 번째 행동은 `interactive-secondary`.
- 누를 수 있는 것은 반드시 hover·active 세 단계를 함께 쓴다. 투명한 버튼·목록 칸·안 고른 칩은 `interactive-ghost-hover`·`-active`.
- 링크는 `text-link` + 밑줄. 색만으로 링크임을 알리지 않는다.
- `border-default` 는 장식 구분선, 입력칸·칩·외곽선 버튼처럼 **뜻을 담는 경계는 `border-strong`**(3:1 이상).
- 오류(`text-error`·`border-error`)와 맵기 빨강(`spicy-*`)은 서로 대신 쓰지 않는다.
- 맵기는 고추 개수(지도 핀·목록) + 게이지 도장 + 「맵기 N」 글로 보인다 (앱 기준, [SpicyStamp](components/SpicyStamp.md)). 단계는 색만으로 구분하지 않는다.

## 3. Primitive 치수

- 간격 `space-0` · `2` · `4` · `6` · `8` · `12` · `16` · `20` · `24` · `32` · `40` · `48` · `64` · `80` (이름 = px).
  - 폰 좌우 여백 `space-16`, 섹션 사이 `space-24`(폰) · `space-32`(태블릿 이상), 아이콘과 글자 `space-4`, 칩 사이 `space-8`.
- 모서리 `radius-0` · `2` · `4` · `8` · `12` · `radius-full`.
  - 배지 `radius-4`, 칩·입력칸·스낵바 `radius-8`, 카드·시트·FAB `radius-12`, 버튼·도장·탭 알약 `radius-full`.
- 누르는 영역 `target-min` 48px, 아이콘 `icon-md` 24px · `icon-sm` 20px.

## 4. Typography

**제목은 조선100년체, 본문은 Pretendard (11-13 수정판).** 제목(`h1`~`h3` · `font-heading`)과 지도 이름표는 `font-family-base`(조선100년체), 본문·버튼·칩·입력칸·작은 정보는 Pretendard(`--font-sans`, `src/app/globals.css`). 서비스 이름 「떡볶여지도」는 `font-family-wordmark`(을지로10년후체, OFL) — 다섯 글자만 남긴 서브셋 `TteokWordmark`(8.9KB)라 다른 글자는 나오지 않는다.

- 바꾼 까닭 (11-13 점검): 조선100년체로 14px 아래를 쓰면 「전→컨」「누들→누둘」「수정→수청」으로 읽혔다(화면 코드에 14px 미만 162곳). 굵기도 하나뿐이라 굵게 지정 127곳이 강조가 안 됐다. 11-04 「제목만 조선100년체」 제안과도 맞춘다.
- 내려받기: 조선100년체는 미리 받지 않고(`preload: false`) 제목이 나오는 화면에서만 받는다. Pretendard 는 화면에 나온 글자 조각만 받는다. 관리자 화면은 제목도 Pretendard 라 조선100년체를 받지 않는다.

- 조선100년체(방일영문화재단): 한글 11,172자·영문·숫자·기호(`·…「」→₩`)가 모두 들어 있다(글꼴 파일에서 확인). 사용자 사진 속 굵은 붓 「떡볶여지도」 줄과 가장 닮은 글꼴(글자별 일치도 0.947). 로고(호랑이)나 이름 글씨(을지로10년후체)와는 다른 글씨다.
- 조선100년체는 **굵기가 Regular 하나뿐**이다. 제목에는 `font-weight: bold` 를 주지 않는다(`font-synthesis-weight: none` 으로 가짜 굵게를 막아 두어 보통 굵기로 나온다). 제목 강조는 **크기 · 색 · 자간**. 본문 Pretendard 는 굵기가 다 있어 굵게를 써도 된다.
- 조선100년체는 명조 계열이라 작은 글자에서 획이 흐려진다 → 16px 이상(제목)에만 쓴다. 본문은 14px 이상을 권하고, 동네·「확인 N일 전」 같은 작은 정보(12~13px)는 Pretendard 라 읽힌다.
- 예비 글꼴: 나눔명조 → Noto Serif KR → AppleMyungjo → serif (조선100년체를 불러오지 못했을 때만).

### 사용 금지: 이미지로 대신한다

조선100년체 라이선스는 웹사이트·서버 탑재를 허용하지만 **로고 · 브랜드명 · 슬로건 사용과 파일 수정을 금지**한다(눈누 요약 기준). 그래서:

> **11-13 원문 확인** (event.chosun.com/100/100font.html): 원문에는 「자유 재배포 · 판매 금지 · 수정본 판매 금지 · 배포된 형태 그대로 사용」이 있고, 「로고·슬로건 금지」는 원문이 아니라 눈누 요약에서 온 것이다. 또 `ChosunCentennial.woff2` 는 눈누 CDN 의 변환본과 같은 파일(SHA-256 일치)이고, 공식 배포본은 TTF·OTF 뿐이다. 🔴 팀 결정: ① 공식 파일로 바꾸기(용량이 커짐) ② 방일영문화재단(02-724-5040)에 웹폰트 변환 사용을 물어보기. 아래 표는 결정 전까지 그대로 지킨다.

| 자리 | 하는 것 |
|---|---|
| 로고 | 호랑이 그림 `tiger-logo.png` |
| 헤더의 서비스 이름, 첫 화면 큰 이름, 표지 | `.wordmark` 글자 (`wordmark` 스타일, 색 `text-wordmark`) |
| 슬로건 | `slogan_ink.png` 이미지 (alt = 슬로건 문장) |
| 공유 미리보기 이미지, 앱 아이콘, 이메일, 인쇄물처럼 글꼴을 쓸 수 없는 곳 | 호랑이 로고 + `wordmark_red.svg`. 조선100년체로 「떡볶여지도」를 새로 그리지 않는다 |
| 「떡볶여지도 사용법」처럼 이름이 든 제목 | 이름 부분만 `font-family-wordmark`, 나머지 글자는 조선100년체 |
| 글꼴 파일 | 받은 그대로 쓴다. 잘라 내기(서브셋)·변형 금지 |

본문 문장 속에 이름이 나오면(「떡볶여지도에 가게를 올려 주세요」) 이름 부분만 `font-family-wordmark` 로 감싼다(`<span className="wordmark">`). 조선100년체로 이름을 쓰는 경우는 없다.

### 토큰

- Primitive: `font-family-base` · `font-family-wordmark` · `font-size-14`~`font-size-56`(모두 짝수) · `font-weight-regular` · `line-height-20`~`line-height-64` · `letter-spacing-tight`·`normal`·`wide`. 크기·줄 높이 이름은 px, 값은 rem 이라 브라우저 글자 크기 설정을 따른다.

| 스타일 | 크기 | 줄 높이 | 자간 | 쓰는 곳 |
|---|---|---|---|---|
| `display-large` | 56 | 64 | tight | 첫 화면 큰 제목 (이름은 로고 이미지로) |
| `display-medium` | 44 | 52 | tight | 빈 화면·완료 화면 |
| `heading-1` | 36 | 44 | tight | 데스크톱 h1 |
| `heading-2` | 28 | 36 | normal | 폰 h1 |
| `heading-3` | 24 | 32 | normal | 섹션 h2, 다이얼로그 제목 |
| `heading-4` | 20 | 28 | normal | 카드 제목, 목록 가게 이름 |
| `body-large` | 18 | 28 | normal | 기본 본문, 입력칸, 버튼 |
| `body-medium` | 16 | 26 | normal | 주소·거리·도움말, 칩 |
| `body-small` | 14 | 22 | normal | 메타 정보 (본문 하한) |
| `caption` | 14 | 20 | normal | 사진 설명, 아래 막대 이름 |
| `overline` | 14 | 20 | wide | 제목 위 분류 글자 |

모든 스타일: 가족 `font-family-base`, 굵기 `font-weight-regular`. 이름 전용: `wordmark`(을지로10년후체 서브셋 36/44, 색 `text-wordmark`). 지도 전용: `map-label`(18/24, 바탕색 2px 글자 테두리), `stamp-number`(20/24).

**변수 연결.** `src/app/tokens.css`(생성 파일)에서 스타일마다 다섯 변수를 Primitive 에 묶는다.

```css
--heading-1-font-family: var(--font-family-base);
--heading-1-font-size: var(--font-size-36);
--heading-1-font-weight: var(--font-weight-regular);
--heading-1-line-height: var(--line-height-44);
--heading-1-letter-spacing: var(--letter-spacing-tight);
```

CSS 에서는 `var(--body-large-font-size)` 처럼 Semantic 변수를 쓰고, Tailwind 에서는 `text-heading-1` 처럼 쓰면 크기·줄 높이·자간이 함께 들어간다.

## 말투

- 존댓말 해요체, 짧게. 「길찾기」「저장했어요」「가게를 찾지 못했어요. 지도를 조금 옮겨 보세요」.
- 버튼은 동사로 끝낸다: 「제보하기」「맞아요」「달라요」.
- 오류는 무엇이 잘못됐고 어떻게 고치는지 한 문장씩. 사과하지 않는다.
- 떡볶이 말을 그대로: 쌀떡 · 밀떡 · 국물 · 즉석 · 짜장 · 로제, 맵기는 「1단계 순한맛 ~ 5단계 아주 매운맛」. 이모지는 쓰지 않는다.

## 높낮이 · 움직임

- 그림자는 면을 지도 위로 띄울 때만: 검색창·카드 `elevation-1`, 아래 막대 `elevation-2`, FAB·시트·스낵바 `elevation-3`. 고대비 테마는 그림자 대신 `border-strong` 테두리.
- 상태 변화 100ms, 시트 열림 250ms, 곡선 `cubic-bezier(0.2, 0, 0, 1)`. `prefers-reduced-motion` 이면 움직이지 않는다.

## 아이콘

- 24px 선 아이콘(2px 획, 둥근 끝), 색은 `icon-*` 토큰. 앱에서는 lucide-react 의 같은 모양을 쓴다.
- 아이콘만 있는 버튼은 `aria-label`, 장식 아이콘은 `aria-hidden="true"`.

## 로고와 이름 글씨

- **로고는 호랑이 그림** `tiger-logo.png`(떡꼬치를 문 채 윙크하는 호랑이, PNG 원본). 로딩 스플래시, 앱 아이콘, 공유 이미지, 빈 화면에 쓴다. 앱의 `TigerLoader` 가 쓰는 `tiger-hoho.webp` 는 이 그림을 줄인 판이다. 지도 첫 화면의 로딩은 11-12 부터 호랑이 대신 「대동여지도 확대」 전환(`IntroZoom`, 보드 IN-01)이다. SVG 판은 없다(색연필 질감이라 PNG).
- **이름은 글자로 쓴다.** `<span className="wordmark">떡볶여지도</span>`(`src/components/brand/Logo.tsx`) — 글꼴 `font-family-wordmark`(을지로10년후체 서브셋), 색 `text-wordmark`(밝게 #C00000 · 어둡게 #FF7A70 · 고대비 #9A0000). 진짜 글자라 스크린 리더가 그대로 읽고, 크기·테마를 따라간다.
- 글꼴을 쓸 수 없는 곳(공유 미리보기, 아이콘, 이메일, 인쇄물)만 `wordmark_red.svg` 그림을 쓴다.
- 서브셋에는 「떡볶여지도」 다섯 글자만 있다. 다른 글자를 `.wordmark` 로 감싸면 예비 글꼴로 보이니 이름에만 쓴다.
- 둘을 함께 쓸 때는 호랑이 위·이름 아래, 사이 `space-8`. 호랑이가 이름보다 크다.
- 호랑이 그림은 한지 바탕까지 한 장이라 모서리를 `radius-12` 로 둥글린다. 호랑이가 혼자 쓰이면 `alt="떡볶여지도"`, 이름 글자 옆이면 `alt=""`(같은 이름을 두 번 읽지 않게).

## 부품

| 부품 | 언제 |
|---|---|
| `Button` | filled(주 행동) · tonal · outlined · text |
| `Fab` | 제보하기. 지도 화면 오른쪽 아래 하나 |
| `FilterChip` | 떡 종류·스타일·맵기 필터 |
| `TextField` | 가게 이름·주소·소개 입력 |
| `SpicyStamp` | 맵기 1~5 도장 |
| `StoreListItem` | 목록의 가게 한 칸 |
| `NavigationBar` | 폰 아래 탐색 막대 |
| `Snackbar` | 저장·제보 결과 알림 |

## 수정판 기록 (11-13, 브랜치 `feature/design-fix`)

11-13 디자인 시스템 점검 · 게슈탈트 분석에서 찾은 것을 고친 판. 토큰 원본(`tokens.json`, Claude 디자인 아티팩트)은 건드리지 않고, 이음(`globals.css`)·화면·문서만 고쳤다. 비교 화면은 슬랙 #design 에 올린 비교 페이지와 같은 조건으로 다시 찍었다.

| 고친 것 | 전 | 후 |
|---|---|---|
| 이름 글씨 · 찜 하트 색 | `globals.css` 가 `--brand-red` 를 제보 갈색으로 덮어써 갈색 | 덮어쓰기를 `--report`(등록 버튼·등록 핀)로 이름을 바꿔 떼어 냄 → 토큰 그대로 #C00000 |
| 글꼴 | 모든 글자 조선100년체 | 제목 조선100년체 · 본문 Pretendard |
| 글꼴 내려받기 | 모든 페이지 1,164KB (관리자 포함) | 조선100년체는 제목이 나오는 화면에서만 · Pretendard 조각만 |
| 보기만 하는 태그 | 회색 테두리 알약 · 네모 상자 · 테두리 배지 세 가지 | 테두리 없는 옅은 바탕 한 가지 (누르는 칩·버튼은 테두리) |
| 「선택됨」 | 검정 채움 · 회색 줄 · 옥빛 테두리 | 옥빛 한 가지 (정렬·칩 = 옥빛 채움, 고른 줄 = 옥빛 옅은 바탕 + 왼쪽 막대) |
| 지금 있는 메뉴 | 표시 없음 (조선100년체라 굵게도 안 보임) | 폰 아래 메뉴 = 그림 + 옥빛 + 위 막대 · PC 위 메뉴 = 옥빛 옅은 바탕 |
| 안 고른 정렬 | 70% 옅은 글자 (못 누르는 것처럼 보임) | 보통 보조 글자색 |
| 등록 단계 막대 | 안 한 칸이 진한 회색 | 안 한 칸은 옅은 선 색 |
| 링크 색 | 등록 버튼과 비슷한 갈색 | 옥빛 글자 (갈색은 등록 하나만) |
| 역 이름 | 도장이 「홍대입구역」 등을 덮음 | 역 이름이 도장을 비켜 옆으로 |
| 흐린 도장 | 뜻이 안 보임 | 지도 범위 안에 있으면 「흐린 도장 = 반년 넘게 확인 안 됨」 |
| 가게 상세 제목 | 「가게 위치」 | 「가게 정보」 |
| manifest · themeColor | #ffffff · #F3F1EE (서로 다름) | 둘 다 앱 바탕 #F3F1EE |
| 문서 | 맵기 = 색 원+숫자 · 로딩 = 호랑이 · 글꼴 하나 | 앱과 같게 |

팀이 정할 것 (이 판에서 안 바꿈): 웹 바탕 P3 회색 종이 vs T2 흰색(11-11 결정과 다름) · 조선100년체 파일 출처 · 맵기 표시의 주인공(고추 개수 하나로?) · 폰 등록 버튼이 도장을 가리는 것 · 등록 화면 지도의 다른 가게 도장.

