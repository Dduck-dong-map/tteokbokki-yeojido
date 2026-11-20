import { cn } from "@/lib/utils";

// 별 하나. 색은 text-star(globals.css 의 --star) 한 곳에서 정한다. 별을 그리는 곳은 모두 이것을 쓴다 (다시 그리지 않는다).
// 장식이라 스크린 리더에는 숨긴다 — 쓰는 쪽이 「평점」 같은 글자를 함께 둔다
export function StarGlyph({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={cn("text-star", className)}>
      ★
    </span>
  );
}

// 가게 평점(별 1~5) — 거지맵처럼 「★ 4.3 · 12개」. 글자 크기는 글자 토큰으로 준다(기본 text-caption 14px)
export function Stars({ rating, className }: { rating?: { avg: number; count: number }; className?: string }) {
  if (!rating || !rating.count) return <span className={cn("text-caption text-muted-foreground/70", className)}>평점 아직 없음</span>;
  return (
    <span className={cn("inline-flex items-center gap-1 text-caption font-semibold text-foreground", className)}>
      <StarGlyph />
      <span className="sr-only">평점</span>
      {rating.avg.toFixed(1)}
      <span className="font-normal text-muted-foreground/70">· {rating.count}개</span>
    </span>
  );
}
