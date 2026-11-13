# Fab

제보 FAB 는 지도 화면 오른쪽 아래에 하나만 둔다. 바탕은 `interactive-accent`(제보 갈색, hover·active 단계 포함), 그림자 `elevation-3`, 모양 `radius-12`.

- 기본은 글자가 있는 넓은 FAB(「제보하기」). 지도를 움직이는 동안 아이콘만 있는 56px 로 줄여도 되지만 그때는 `aria-label` 이 남는다.
- 아래 탐색 막대·시트와 겹치지 않게 그 위 `space-16` 에 둔다. 안전 영역(`env(safe-area-inset-bottom)`)을 더한다.
- 쓰는 쪽이 줄 것: `onClick`(제보 화면 열기). 글자를 바꿀 땐 `label`.
