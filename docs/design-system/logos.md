# 로고와 이름 글씨

- **로고 = 호랑이** — 원본 [`docs/캐릭터/캐릭터시안_v3_2026-11-05/호랑이_나_윙크_떡하나_v01.png`](../캐릭터/캐릭터시안_v3_2026-11-05/호랑이_나_윙크_떡하나_v01.png), 앱용 줄인 판 `public/loading/tiger-hoho.webp`. 떡꼬치를 문 채 윙크하는 호랑이(1024×1024 PNG 원본, 한지 바탕이 그림에 포함). 로딩 스플래시, 공유 이미지, 빈 화면의 얼굴. 혼자 쓰이면 `alt="떡볶여지도"`, 이름 글씨 옆이면 `alt=""`.
- **앱 아이콘 = 지도 핀 + 떡** (11-26) — 원본 [`assets/app-icon_1024.png`](assets/app-icon_1024.png)(1024×1024, 직각 모서리, 알파 없음 — App Store 규격), Play 스토어용 [`assets/app-icon_play_512.png`](assets/app-icon_play_512.png). 빨간 지도 바탕에 흰 핀, 핀 안에 떡 세 개. 호랑이는 잔선이 많아 29~60px 에서 뭉개져 아이콘으로는 쓰지 않는다. 앱에 들어간 판은 모두 이 원본을 줄인 것이다: `src/app/favicon.ico`(16·32·48) · `icon.png`(64) · `apple-icon.png`(180) · `public/icons/icon-192.png` · `icon-512.png` · `icon-maskable-512.png`(그림을 72% 로 줄이고 둘레를 빨강으로 채운 판 — 안드로이드가 원으로 잘라도 핀과 느낌표가 남는다). 모서리는 스토어 · 기기가 깎으므로 원본에 둥근 모서리 · 테두리 · 그림자를 넣지 않는다.
- [`assets/wordmark_red.svg`](assets/wordmark_red.svg) — **이름 글씨 그림.** 을지로10년후체(우아한형제들, OFL)의 글자 윤곽을 그대로 옮긴 「떡볶여지도」, 색 #C00000(`brand-red`). **글꼴을 쓸 수 없는 곳에만**: 공유 미리보기(OG) 이미지, 앱 아이콘·파비콘, 이메일, 인쇄물. 앱 화면에서는 그림 대신 `.tt-wordmark` 글자로 쓴다.
- `public/brand/slogan_ink.png` — 손글씨 슬로건 세 줄(먹색). 첫 화면에만. alt 는 세 줄 문장 그대로.

호랑이 그림은 한지 바탕까지 한 장이라 `background-primary` 위에서는 네모 판으로 보인다. 모서리는 `radius-12` 로 둥글린다.

앱 화면의 이름 글씨는 그림이 아니라 글자다: `src/components/brand/Logo.tsx` → `<span className="wordmark">떡볶여지도</span>`(글꼴 `src/app/fonts/TteokWordmark.woff2`).
