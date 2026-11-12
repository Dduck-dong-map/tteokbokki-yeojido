# Snackbar

스낵바는 저장·제보 결과를 잠깐 알린다. `background-inverse` 바탕, 글자 `text-inverse`, 행동 글자 `text-inverse-action`.

- `role="status"` 라 스크린 리더가 하던 일을 끊지 않고 읽는다.
- 최소 4초, 행동이 있으면 10초 이상. 마우스·포커스가 올라가 있으면 사라지지 않는다.
- 행동은 하나까지(「되돌리기」). 오류처럼 꼭 고쳐야 하는 일은 스낵바가 아니라 화면 안 오류 띠로.
- 쓰는 쪽이 줄 것: 글자, 필요하면 `action`·`onAction`.
