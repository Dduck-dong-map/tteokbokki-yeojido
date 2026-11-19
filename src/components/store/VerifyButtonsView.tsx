import { Button } from "@/components/ui/button";
import type { VerifyButtonsViewProps } from "./types";

// 새로 올라온 가게를 가 본 사람이 거르는 「맞아요」「달라요」 두 단추. fetch·router.refresh 는 컨테이너(VerifyButtons)가 맡는다.
// 가게 상세의 주 행동(옥빛 filled)은 길찾기 하나라, 「맞아요」는 두 번째 행동(tonal) · 「달라요」는 보조(outlined)다.
// compact 는 목록 카드 안처럼 좁은 곳: 보이는 높이 32px, 누르는 범위는 .hit-target 이 48px 로 넓힌다.
export default function VerifyButtonsView({ busy, message, compact = false, onVote }: VerifyButtonsViewProps) {
  const size = compact ? "compact" : "md";
  return (
    <div>
      <div className="flex gap-2">
        <Button type="button" variant="tonal" size={size} disabled={busy} onClick={() => onVote(true)} className="min-w-0 flex-1">
          맞아요
        </Button>
        <Button type="button" variant="outlined" size={size} disabled={busy} onClick={() => onVote(false)} className="min-w-0 flex-1">
          달라요
        </Button>
      </div>
      {message && <p className="mt-1.5 text-caption text-muted-foreground/70">{message}</p>}
    </div>
  );
}
