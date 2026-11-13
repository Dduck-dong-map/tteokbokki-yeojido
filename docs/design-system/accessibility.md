# 웹접근성 기준

목표는 **WCAG 2.2 AA**(한국 KWCAG 2.2 포함), 고대비 테마는 글자 AAA(7:1). 아래 규칙을 지키지 못하는 화면은 내보내지 않는다.

## 1. 대비

- 글자는 바탕과 **4.5:1 이상**, 24px 이상 글자는 3:1 이상. 조선100년체는 굵기가 하나라 「굵은 글자 완화」는 쓰지 않는다.
- 입력칸·칩·외곽선 버튼의 테두리, 포커스 고리, 뜻을 담은 아이콘은 **3:1 이상**(WCAG 1.4.11). 그래서 테두리는 `border-strong` 을 쓰고, `border-default` 는 장식 구분선에만 쓴다. hover·active 바탕(`interactive-*-hover`·`-active`, `interactive-ghost-*`) 위에서도 글자 대비를 지킨다.
- 고대비 테마: 글자 7:1 이상, 그림자를 없애고 면은 `border-strong` 테두리로 나눈다.
- 쓸 수 없는 컨트롤(38%)은 대비 기준 예외지만, 이유를 글로 함께 보인다.
- 대비 표(맨 아래)는 tokens.json 값으로 계산했다. 색을 바꾸면 표를 다시 만든다.

## 2. 색만으로 전하지 않기 (1.4.1)

- 맵기는 색 + **숫자**(「3단계」) + 도장 표정. 색을 못 구분해도 단계를 읽을 수 있다.
- 선택된 칩은 색 + **체크 아이콘** + `aria-pressed="true"`.
- 오류 입력칸은 빨간 테두리 + **오류 아이콘과 문장** + `aria-invalid="true"`.
- 본문 링크는 `text-link` 색 + **밑줄**.
- 지도 핀의 영업 중/마감은 색이 아니라 모양(채움/빈 원)과 글자로 구분한다.

## 3. 키보드와 포커스 (2.1 · 2.4)

- 모든 기능은 키보드로 된다. 순서는 화면을 읽는 순서(검색 → 필터 → 지도 → 목록 → 아래 막대).
- `:focus-visible` 에 `border-focus` 3px 실선, 2px 띄움. `outline: none` 만 남기지 않는다.
- 포커스된 요소가 시트·고정 막대에 가려지지 않게 `scroll-padding` 을 막대 높이만큼 준다(2.4.11).
- 시트·다이얼로그는 열리면 첫 컨트롤로 포커스를 옮기고, 안에서만 돌며, `Esc` 로 닫고, 닫으면 연 버튼으로 돌아간다.
- 페이지 맨 앞에 「본문으로 건너뛰기」 링크.
- 지도: 화살표 키로 이동, `+`/`-` 로 확대. 지도 안 핀은 키보드로 다 돌 수 없으니 **같은 가게를 목록으로도 보인다**(목록이 지도의 대체 경로).

## 4. 누르는 영역 (2.5.8)

- 누를 수 있는 것은 모두 `target-min` 48px, 서로 `space-8` 이상 띄운다(AA 최소 24px 보다 넉넉하게).
- 끌기(시트 손잡이)는 누르기로도 된다: 손잡이를 누르면 반/전체/닫힘이 바뀐다(2.5.7).
- 지도를 두 손가락으로 확대하는 기능은 `+`/`-` 버튼으로도 된다(2.5.1).

## 5. 스크린 리더

- 언어 `<html lang="ko">`. 화면마다 `h1` 하나, 제목 단계는 건너뛰지 않는다.
- 영역: `header` · `nav`(아래 막대, `aria-label="주 메뉴"`) · `main` · 검색은 `role="search"`.
- 아이콘 버튼은 `aria-label`, 장식 아이콘은 `aria-hidden="true"`.
- 맵기 도장은 그림이 아니라 글: `aria-label="맵기 3단계"` 또는 옆에 숨김 글자.
- 결과 개수, 저장·제보 결과(스낵바)는 `role="status"`(`aria-live="polite"`)로 읽힌다. 오류는 `role="alert"`.
- 지도 캔버스는 `role="application"` 대신 `aria-label="떡볶이 가게 지도, 가게 24곳"` 처럼 요약하고, 자세한 내용은 목록으로 안내한다.
- 입력칸은 보이는 `label` 을 가진다(placeholder 로 대신하지 않는다). 도움말·오류는 `aria-describedby` 로 묶는다.

## 6. 글자 크기와 화면 (1.4.4 · 1.4.10 · 1.4.12)

- 글자 크기는 `rem`(토큰 `font-size-*`·`line-height-*` 값이 rem). 브라우저 글자 200% 에서 잘리거나 겹치지 않는다.
- 320px 폭에서 가로 스크롤 없이 한 줄로 쌓인다(지도와 표만 예외).
- 사용자가 줄 간격 1.5배, 글자 간격 0.12em 으로 바꿔도 칸이 넘치지 않게 높이를 고정하지 않는다.
- 화면 확대(`user-scalable`)를 막지 않는다.

## 7. 움직임과 시간 (2.2 · 2.3)

- `prefers-reduced-motion` 을 따른다. 깜빡임 없음.
- 스낵바는 최소 4초, 행동(「되돌리기」)이 있으면 10초 이상 머물고, 마우스·포커스가 올라가 있는 동안은 사라지지 않는다.
- 제보 입력 중 시간 제한 없음. 실수로 닫으면 쓴 내용을 지키고 「작성 중인 제보가 있어요」로 묻는다.

## 8. 입력과 오류 (3.3)

- 필수 칸은 라벨에 「(필수)」 글자로 표시(별표만 쓰지 않는다).
- 오류는 칸 바로 아래, 무엇이 잘못됐고 어떻게 고치는지. 제출 실패 시 첫 오류 칸으로 포커스.
- 주소는 검색으로 고르게 해 직접 타이핑을 줄인다(3.3.8). 캡차는 퍼즐 대신 보이지 않는 방식.
- 한 번 입력한 내용(가게 이름 등)은 다음 단계에서 다시 묻지 않는다(3.3.7).

## 9. 검수 순서

1. 자동 검사: axe(Playwright `@axe-core/playwright`)를 화면마다 돌려 위반 0.
2. 키보드만으로 제보 흐름 끝까지.
3. VoiceOver(iOS Safari) · TalkBack(안드로이드 Chrome)으로 지도 홈 → 가게 상세 → 길찾기.
4. 글자 200%, 320px 폭, 고대비 테마, 동작 줄이기 켜고 한 번씩.

## 대비 표

tokens.json 의 Semantic → Primitive 를 따라가 계산한 값. 기준: 글자 4.5(고대비 7), 아이콘·테두리·포커스 3. 61쌍 × 3테마 모두 통과.

| 글자·선 | 바탕 | 밝게 | 어둡게 | 고대비 | 기준 |
|---|---|---|---|---|---|
| `text-primary` | `background-primary` | 12.22 | 14.79 | 21.00 | 4.5 (고대비 7) |
| `text-secondary` | `background-primary` | 6.93 | 10.95 | 10.33 | 4.5 (고대비 7) |
| `icon-primary` | `background-primary` | 12.22 | 14.79 | 21.00 | 3 |
| `icon-secondary` | `background-primary` | 5.23 | 10.95 | 10.33 | 3 |
| `border-strong` | `background-primary` | 5.23 | 6.72 | 21.00 | 3 |
| `border-focus` | `background-primary` | 8.27 | 14.78 | 21.00 | 3 |
| `interactive-primary` | `background-primary` | 6.31 | 10.68 | 12.03 | 3 |
| `text-primary` | `background-secondary` | 13.66 | 12.22 | 21.00 | 4.5 (고대비 7) |
| `text-secondary` | `background-secondary` | 7.75 | 9.04 | 10.33 | 4.5 (고대비 7) |
| `icon-primary` | `background-secondary` | 13.66 | 12.22 | 21.00 | 3 |
| `icon-secondary` | `background-secondary` | 5.85 | 9.04 | 10.33 | 3 |
| `border-strong` | `background-secondary` | 5.85 | 5.55 | 21.00 | 3 |
| `border-focus` | `background-secondary` | 9.25 | 12.21 | 21.00 | 3 |
| `interactive-primary` | `background-secondary` | 7.05 | 8.82 | 12.03 | 3 |
| `text-primary` | `background-tertiary` | 10.86 | 9.17 | 18.63 | 4.5 (고대비 7) |
| `text-secondary` | `background-tertiary` | 6.16 | 6.79 | 9.17 | 4.5 (고대비 7) |
| `icon-primary` | `background-tertiary` | 10.86 | 9.17 | 18.63 | 3 |
| `icon-secondary` | `background-tertiary` | 4.65 | 6.79 | 9.17 | 3 |
| `border-strong` | `background-tertiary` | 4.65 | 4.16 | 18.63 | 3 |
| `border-focus` | `background-tertiary` | 7.36 | 9.16 | 18.63 | 3 |
| `interactive-primary` | `background-tertiary` | 5.61 | 6.62 | 10.67 | 3 |
| `text-primary` | `interactive-ghost-hover` | 10.86 | 9.17 | 18.63 | 4.5 (고대비 7) |
| `text-secondary` | `interactive-ghost-hover` | 6.16 | 6.79 | 9.17 | 4.5 (고대비 7) |
| `border-strong` | `interactive-ghost-hover` | 4.65 | 4.16 | 18.63 | 3 |
| `text-primary` | `interactive-ghost-active` | 9.04 | 6.93 | 16.56 | 4.5 (고대비 7) |
| `text-secondary` | `interactive-ghost-active` | 5.13 | 5.13 | 8.15 | 4.5 (고대비 7) |
| `border-strong` | `interactive-ghost-active` | 3.87 | 3.15 | 16.56 | 3 |
| `text-brand` | `background-primary` | 6.31 | 10.68 | 12.03 | 4.5 (고대비 7) |
| `text-link` | `background-primary` | 4.57 | 10.53 | 9.13 | 4.5 (고대비 7) |
| `text-link-hover` | `background-primary` | 6.18 | 13.02 | 11.87 | 4.5 (고대비 7) |
| `text-link-active` | `background-primary` | 8.10 | 14.78 | 15.26 | 4.5 (고대비 7) |
| `text-error` | `background-primary` | 5.80 | 10.91 | 8.70 | 4.5 (고대비 7) |
| `icon-location` | `background-primary` | 6.06 | 9.23 | 8.95 | 3 |
| `interactive-accent` | `background-primary` | 6.24 | 10.69 | 11.89 | 3 |
| `text-brand` | `background-secondary` | 7.05 | 8.82 | 12.03 | 4.5 (고대비 7) |
| `text-link` | `background-secondary` | 5.11 | 8.70 | 9.13 | 4.5 (고대비 7) |
| `text-link-hover` | `background-secondary` | 6.90 | 10.75 | 11.87 | 4.5 (고대비 7) |
| `text-link-active` | `background-secondary` | 9.05 | 12.21 | 15.26 | 4.5 (고대비 7) |
| `text-error` | `background-secondary` | 6.48 | 9.01 | 8.70 | 4.5 (고대비 7) |
| `icon-location` | `background-secondary` | 6.77 | 7.63 | 8.95 | 3 |
| `interactive-accent` | `background-secondary` | 6.98 | 8.83 | 11.89 | 3 |
| `text-error` | `background-error` | 6.21 | 11.32 | 8.27 | 4.5 (고대비 7) |
| `text-wordmark` | `background-primary` | 5.75 | 6.57 | 8.85 | 4.5 (고대비 7) |
| `text-wordmark` | `background-secondary` | 6.42 | 5.42 | 8.85 | 4.5 (고대비 7) |
| `text-inverse` | `background-inverse` | 12.22 | 12.22 | 21.00 | 4.5 (고대비 7) |
| `text-inverse-action` | `background-inverse` | 8.82 | 8.27 | 13.45 | 4.5 (고대비 7) |
| `text-on-secondary` | `background-brand` | 15.43 | 11.48 | 18.62 | 4.5 (고대비 7) |
| `text-on-interactive` | `interactive-primary` | 7.11 | 11.15 | 12.03 | 4.5 (고대비 7) |
| `text-on-interactive` | `interactive-primary-hover` | 9.33 | 13.69 | 15.51 | 4.5 (고대비 7) |
| `text-on-interactive` | `interactive-primary-active` | 12.03 | 15.43 | 17.41 | 4.5 (고대비 7) |
| `text-on-secondary` | `interactive-secondary` | 15.43 | 11.48 | 18.62 | 4.5 (고대비 7) |
| `text-on-secondary` | `interactive-secondary-hover` | 13.69 | 8.90 | 16.51 | 4.5 (고대비 7) |
| `text-on-secondary` | `interactive-secondary-active` | 11.15 | 6.79 | 13.45 | 4.5 (고대비 7) |
| `text-on-accent` | `interactive-accent` | 7.04 | 11.22 | 11.89 | 4.5 (고대비 7) |
| `text-on-accent` | `interactive-accent-hover` | 9.18 | 13.74 | 15.34 | 4.5 (고대비 7) |
| `text-on-accent` | `interactive-accent-active` | 11.89 | 15.54 | 17.51 | 4.5 (고대비 7) |
| `text-on-spicy-low` | `spicy-1` | 9.29 | 9.29 | 11.93 | 4.5 (고대비 7) |
| `text-on-spicy-low` | `spicy-2` | 5.85 | 5.85 | 7.51 | 4.5 (고대비 7) |
| `text-on-spicy-high` | `spicy-3` | 5.42 | 5.42 | 7.63 | 4.5 (고대비 7) |
| `text-on-spicy-high` | `spicy-4` | 8.72 | 8.72 | 9.47 | 4.5 (고대비 7) |
| `text-on-spicy-high` | `spicy-5` | 14.55 | 14.55 | 15.80 | 4.5 (고대비 7) |
