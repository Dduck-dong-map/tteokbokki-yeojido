import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SaveButtonViewProps } from "./types";

// 가게 상세 머리칸 오른쪽 ♡/♥ 와 잠깐 뜨는 토스트. 찜 여부·토스트 문구·누름 핸들러는 컨테이너(SaveButton.tsx)가 넘긴다.
// localStorage(lib/mine)·타이머는 여기 없다. 켜짐은 aria-pressed 와 채운 하트(fill-current)·고추장 빨강으로 함께 보인다. 아이콘은 lucide Heart.
export default function SaveButtonView({ name, on, toast, onPress }: SaveButtonViewProps) {
  return (
    <>
      <Button
        type="button"
        variant="text"
        size="icon-xl"
        onClick={onPress}
        aria-pressed={on}
        aria-label={on ? `${name} 찜 취소` : `${name} 찜하기`}
        className={cn("transition-transform active:scale-90", on ? "text-brand-red" : "text-muted-foreground")}
      >
        <Heart className={cn("size-6", on && "fill-current")} strokeWidth={2} aria-hidden="true" />
      </Button>
      {toast && (
        <div role="status" className="pointer-events-none fixed inset-x-0 bottom-24 z-30 flex justify-center px-4">
          <span className="rounded-full bg-foreground/85 px-4 py-2 text-caption font-medium text-background break-keep [overflow-wrap:anywhere]">{toast}</span>
        </div>
      )}
    </>
  );
}
