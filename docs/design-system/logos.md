# 로고와 이름 글씨

- **로고 = 호랑이** — 원본 [`docs/캐릭터시안_v3_2026-11-05/호랑이_나_윙크_떡하나_v01.png`](../캐릭터시안_v3_2026-11-05/호랑이_나_윙크_떡하나_v01.png), 앱용 줄인 판 `public/loading/tiger-hoho.webp`. 떡꼬치를 문 채 윙크하는 호랑이(1024×1024 PNG 원본, 한지 바탕이 그림에 포함). 로딩 스플래시, 앱 아이콘, 공유 이미지, 빈 화면의 얼굴. 혼자 쓰이면 `alt="떡볶여지도"`, 이름 글씨 옆이면 `alt=""`.
- [`assets/wordmark_red.svg`](assets/wordmark_red.svg) — **이름 글씨 그림.** 을지로10년후체(우아한형제들, OFL)의 글자 윤곽을 그대로 옮긴 「떡볶여지도」, 색 #C00000(`brand-red`). **글꼴을 쓸 수 없는 곳에만**: 공유 미리보기(OG) 이미지, 앱 아이콘·파비콘, 이메일, 인쇄물. 앱 화면에서는 그림 대신 `.tt-wordmark` 글자로 쓴다.
- `public/brand/slogan_ink.png` — 손글씨 슬로건 세 줄(먹색). 첫 화면에만. alt 는 세 줄 문장 그대로.

호랑이 그림은 한지 바탕까지 한 장이라 `background-primary` 위에서는 네모 판으로 보인다. 모서리는 `radius-12` 로 둥글린다.

앱 화면의 이름 글씨는 그림이 아니라 글자다: `src/components/brand/Logo.tsx` → `<span className="wordmark">떡볶여지도</span>`(글꼴 `src/app/fonts/TteokWordmark.woff2`).
