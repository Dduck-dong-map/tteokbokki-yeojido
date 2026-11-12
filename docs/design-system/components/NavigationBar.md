# NavigationBar

폰(768px 미만) 아래 탐색 막대. 세 곳: 지도 · 목록 · 내 맛지도. 태블릿 이상은 위 헤더 탭으로 바뀐다.

- `nav aria-label="주 메뉴"`, 지금 화면은 `aria-current="page"` + `interactive-secondary` 알약 + 진한 글자(색만으로 구분하지 않는다).
- 아이콘 + 글자 항상 함께. 높이 `navbar-height` 80px + 안전 영역.
- 지도 위에 뜨므로 `elevation-2`, 고대비에서는 테두리.
- 쓰는 쪽이 줄 것: `current`. 실제 앱은 각 칸을 Next.js `Link` 로 바꾼다.
