import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { VerifyButtonsViewProps } from "./types";

// 새로 올라온 가게를 가 본 사람이 거르는 「맞아요」「달라요」 두 단추. fetch·router.refresh 는 컨테이너(VerifyButtons)가 맡는다.
// compact 는 목록 카드 안처럼 좁은 곳: 폰은 44px 그대로, 768 이상에서만 36px 로 줄인다.
export default function VerifyButtonsView({ busy, message, compact = false, onVote }: VerifyButtonsViewProps) {
  const size = compact ? "h-11 text-[13px] md:h-9" : "h-11 text-[14px]";
  return (
    <div>
      <div className="flex gap-2">
        <Button type="button" disabled={busy} onClick={() => onVote(true)} className={cn("flex-1 rounded-xl font-bold", size)}>
          맞아요
        </Button>
        <Button type="button" variant="outline" disabled={busy} onClick={() => onVote(false)} className={cn("flex-1 rounded-xl border-muted-foreground font-bold", size)}>
          달라요
        </Button>
      </div>
      {message && <p className="mt-1.5 text-[12px] text-muted-foreground/70">{message}</p>}
    </div>
  );
}
