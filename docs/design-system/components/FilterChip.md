# FilterChip

필터 칩은 떡 종류·스타일·맵기 취향을 여럿 고르는 버튼이다. `aria-pressed` 로 켜짐을 알리고, 켜지면 `interactive-primary` 바탕과 **체크 아이콘**이 함께 붙는다(색만으로 구분하지 않는다).

- 보이는 높이 32px, 누르는 영역 48px, 칩 사이 `space-8`.
- 칩 묶음은 `fieldset` + `legend`(「떡 종류」)로 감싸 스크린 리더가 묶음 이름을 읽게 한다.
- 결과 개수가 바뀌면 화면 다른 곳의 `role="status"` 로 「가게 12곳」을 알린다.
- 쓰는 쪽이 줄 것: 글자, `selected`·`onChange`(제어형) 또는 `defaultSelected`.
