import { cn } from "@/lib/utils";
import type { CopyAddressViewProps } from "./types";

// 주소 옆 「주소 복사」/「복사했어요」 칩. clipboard·되돌리는 타이머는 컨테이너(CopyAddress)가 맡는다.
// 칩은 32px 이지만 .hit 로 폰에서 누르는 범위가 44px 로 넓어진다 (REQ-W10).
export default function CopyAddressView({ copied, onCopy }: CopyAddressViewProps) {
  return (
    <button
      type="button"
      onClick={onCopy}
      className={cn("hit h-8 shrink-0 rounded-full border border-input bg-secondary px-3 text-[12px] text-muted-foreground whitespace-nowrap")}
    >
      {copied ? "복사했어요" : "주소 복사"}
    </button>
  );
}
