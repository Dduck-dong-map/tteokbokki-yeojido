import { cn } from "@/lib/utils";
import type { FlagReviewButtonViewProps } from "./types";

// 후기 한 줄 오른쪽 「신고」 글자 단추. 보낸 뒤에는 결과 문구로 바뀐다. storeId·reviewId 는 컨테이너가 핸들러에 묶어 둔다.
export default function FlagReviewButtonView({ message, onFlag }: FlagReviewButtonViewProps) {
  if (message) return <span className="text-[11px] text-muted-foreground/70">{message}</span>;
  return (
    <button type="button" onClick={onFlag} className={cn("hit text-[11px] text-muted-foreground/70 underline underline-offset-2")}>
      신고
    </button>
  );
}
