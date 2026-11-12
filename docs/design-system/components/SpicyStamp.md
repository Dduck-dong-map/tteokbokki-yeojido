# SpicyStamp

맵기 도장은 1~5 단계를 `spicy-N` 바탕 원 + 숫자(`stamp-number`, 조선100년체, 글자색 `text-on-spicy-low`·`text-on-spicy-high`)로 보인다. **색과 숫자와 글자**가 함께 있어 색을 못 구분해도 단계를 읽는다.

- 단계 이름: 1 순한맛 · 2 조금 매운맛 · 3 보통 매운맛 · 4 매운맛 · 5 아주 매운맛.
- 목록처럼 좁은 곳은 `showLabel={false}` 로 원만 보이되, 「맵기 3단계 보통 매운맛」이 스크린 리더에 읽힌다.
- 맵기 빨강은 오류 빨강(`text-error`)과 섞지 않는다.
- 쓰는 쪽이 줄 것: `level`(1~5), 필요하면 `size="large"`.
