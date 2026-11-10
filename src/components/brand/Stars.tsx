// 가게 평점(별 1~5) — 거지맵처럼 「★ 4.3 · 12개」.
export function Stars({ rating, size = 13 }: { rating?: { avg: number; count: number }; size?: number }) {
  if (!rating || !rating.count) return <span className="text-muted-foreground/70" style={{ fontSize: size }}>평점 아직 없음</span>;
  return (
    <span className="inline-flex items-center gap-1 font-semibold text-foreground" style={{ fontSize: size }}>
      <span className="text-[#D98E04]">★</span>
      {rating.avg.toFixed(1)}
      <span className="font-normal text-muted-foreground/70">· {rating.count}개</span>
    </span>
  );
}
