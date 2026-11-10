import { cn } from "@/lib/utils";
import type { SaveButtonViewProps } from "./types";

// 가게 상세 머리칸 오른쪽 ♡/♥ 와 잠깐 뜨는 토스트. 찜 여부·토스트 문구·누름 핸들러는 컨테이너(SaveButton.tsx)가 넘긴다.
// localStorage(lib/mine)·타이머는 여기 없다.
export default function SaveButtonView({ name, on, toast, onPress }: SaveButtonViewProps) {
  return (
    <>
      <button
        type="button"
        onClick={onPress}
        aria-pressed={on}
        aria-label={on ? `${name} 찜 취소` : `${name} 찜하기`}
        className={cn(
          "grid h-11 w-11 place-items-center rounded-full text-[22px] leading-none transition-transform active:scale-90",
          on ? "text-brand-red" : "text-muted-foreground/70",
        )}
      >
        {on ? "♥" : "♡"}
      </button>
      {toast && (
        <div role="status" className="pointer-events-none fixed inset-x-0 bottom-24 z-30 flex justify-center px-4">
          <span className="rounded-full bg-foreground/85 px-4 py-2 text-[13px] font-medium text-background">{toast}</span>
        </div>
      )}
    </>
  );
}
