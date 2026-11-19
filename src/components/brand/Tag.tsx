import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// 보기만 하는 태그. 겉 API(children · spicy)는 예전 ui.tsx 의 Tag 그대로, 안은 shadcn Badge.
// 11-13 수정판(게슈탈트 「유사」): 누르는 칩·버튼은 테두리, 보기만 하는 태그는 테두리 없는 옅은 바탕 한 가지.
// 기존 클래스를 그대로 넘겨 모양을 유지한다(Badge 의 h-5 · rounded-4xl · text-xs 는 cn 이 뒤쪽 우선으로 정리).
// spicybg/spicytext 는 맵기 전용 토큰(globals.css). 나머지는 shadcn 변수.
// 글자 크기에 `!` 를 붙인 까닭: ui/badge 는 기본 cn 을 써서 `text-caption` 을 글자색으로 보고 지우고, Badge 의 text-xs 가 CSS 에서 뒤에 온다.
export function Tag({ children, spicy = false }: { children: React.ReactNode; spicy?: boolean }) {
  return (
    <Badge
      variant={spicy ? "secondary" : "outline"}
      className={cn(
        "inline-flex h-6 items-center rounded-full border px-2.5 text-caption font-medium",
        spicy ? "border-transparent bg-spicybg text-spicytext" : "border-transparent bg-muted text-muted-foreground",
      )}
    >
      {children}
    </Badge>
  );
}
