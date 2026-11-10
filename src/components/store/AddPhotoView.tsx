import { cn } from "@/lib/utils";
import type { AddPhotoViewProps } from "./types";

// 가게 상세에서 바로 사진 더하기. large 는 사진이 하나도 없을 때의 큰 빈 상태, 아니면 사진 줄 끝의 작은 칸.
// 올리기(uploadPhoto·patch·refresh)는 컨테이너(AddPhoto)가 맡고, 여기는 고른 파일 목록만 onFiles 로 넘긴다.
// <label> 이 숨긴 <input type=file> 을 감싸므로 칸 전체가 눌린다 (높이 128px).
export default function AddPhotoView({ busy, message, large = false, onFiles }: AddPhotoViewProps) {
  return (
    <label
      className={cn(
        "grid cursor-pointer place-items-center border border-dashed border-input bg-card px-2 text-center text-[13px] text-muted-foreground/70",
        large ? "h-32 w-full rounded-2xl" : "h-32 w-24 shrink-0 rounded-xl",
      )}
    >
      <span className="break-keep">
        {busy ? "올리는 중…" : large ? "아직 사진이 없어요 · 눌러서 올려 주세요" : "+ 사진"}
        {message && <span className="mt-1 block text-[12px] text-spicytext">{message}</span>}
      </span>
      <input type="file" accept="image/*" multiple className="hidden" disabled={busy} onChange={(e) => onFiles(e.target.files)} />
    </label>
  );
}
