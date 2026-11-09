import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// 태그 알약. 겉 API(children · spicy)는 예전 ui.tsx 의 Tag 그대로, 안은 shadcn Badge.
// 기존 클래스를 그대로 넘겨 모양을 유지한다(Badge 의 h-5 · rounded-4xl · text-xs 는 cn 이 뒤쪽 우선으로 정리).
// gstack-shortcut(dec-R2): 토큰 두 벌 공존, R2 결정 시 정리 — spicybg/spicytext 는 맵기 전용 토큰이라 예외, chip/chipline/ink2 는 web 토큰(기존 모양 유지용)
export function Tag({ children, spicy = false }: { children: React.ReactNode; spicy?: boolean }) {
  return (
    <Badge
      variant={spicy ? "secondary" : "outline"}
      className={cn(
        "inline-flex h-6 items-center rounded-full border px-2.5 text-[12px] font-medium",
        spicy ? "border-transparent bg-spicybg text-spicytext" : "border-chipline bg-chip text-ink2",
      )}
    >
      {children}
    </Badge>
  );
}
