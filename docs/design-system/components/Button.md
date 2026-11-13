# Button

버튼은 행동 하나를 실행한다. 글자는 동사로 끝낸다(「길찾기」「저장하기」).

- **filled**(`interactive-primary` 바탕): 화면에서 가장 중요한 행동 하나에만. 두 개가 필요하면 하나는 **tonal**(`interactive-secondary`).
- **outlined**(`border-strong` 테두리 3:1 이상): 보조 행동. **text**: 「취소」「더 보기」처럼 가장 약한 행동.
- 보이는 높이 40px, 누르는 영역은 위아래로 늘려 `target-min` 48px. 버튼 사이는 `space-8` 이상.
- 쓸 수 없을 때는 `disabled` 로 흐리게 하고, 왜 안 되는지 옆에 글로 보인다.
- 포커스는 `border-focus` 3px 고리. 아이콘만 있는 버튼은 만들지 않는다(그럴 땐 `aria-label` 을 가진 아이콘 버튼).
- 쓰는 쪽이 줄 것: 글자(children), `onClick`, 필요하면 `icon`.
