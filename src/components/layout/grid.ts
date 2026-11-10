// 가게 줄 목록: 폰은 한 줄씩(구분선), 768 이상은 2열 카드, 1280 이상은 3열 (웹 1차 기획 3.2)
// shadcn 변수 유틸만 쓴다. 쓰는 쪽에서 cn(GRID_UL, …) 로 결합한다.
export const GRID_UL = "divide-y divide-border md:grid md:grid-cols-2 md:gap-3 md:divide-y-0 xl:grid-cols-3";
export const GRID_LI = "md:rounded-2xl md:border md:border-border md:bg-card md:transition-shadow md:hover:shadow-md";
