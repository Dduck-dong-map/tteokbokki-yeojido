import { NickField, StarInput } from "@/components/register/fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ReviewFormViewProps } from "./types";

// 평가 남기기. 접힌 상태 = 「별점과 한 줄 후기 남기기」 단추, 펼친 상태 = 별 · 한 줄 후기 · 닉네임 · 닫기/올리기.
// 열림·값·오류·보내는 중과 모든 핸들러는 컨테이너(ReviewForm)가 넘긴다. fetch·checkReview·router.refresh 는 여기 없다.
// StarInput · NickField 는 register/fields 의 것을 그대로 쓴다(④ 등록 화면에서 바뀔 예정).
// 입력 글자는 16px — 더 작으면 아이폰 사파리가 화면을 저절로 확대한다 (REQ-W09).
export default function ReviewFormView({ open, stars, text, error, busy, onOpen, onClose, onStarsChange, onTextChange, onSubmit }: ReviewFormViewProps) {
  if (!open)
    return (
      <Button type="button" variant="outline" onClick={onOpen} className={cn("h-11 w-full rounded-xl border-input bg-card text-[14px] font-bold")}>
        별점과 한 줄 후기 남기기
      </Button>
    );

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border p-3">
      <div>
        <p className="mb-1 text-[13px] font-bold">가게는 어땠어요?</p>
        <StarInput value={stars} onChange={onStarsChange} hint="골라 주세요" />
      </div>
      <label className="text-[13px] font-bold">
        한 줄 후기 <span className="font-normal text-muted-foreground/70">선택</span>
        <Input
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          maxLength={80}
          placeholder="예: 어묵 국물이 진해요"
          className={cn("mt-1 h-11 rounded-xl bg-card px-3 text-[16px] font-normal text-foreground md:text-[16px]")}
        />
      </label>
      <NickField />
      {error && <p className="text-[13px] text-spicytext">{error}</p>}
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onClose} className={cn("h-11 w-20 rounded-xl border-input bg-card text-[14px] font-normal text-muted-foreground")}>
          닫기
        </Button>
        <Button type="button" onClick={onSubmit} disabled={busy} className={cn("h-11 flex-1 rounded-xl text-[14px] font-bold")}>
          {busy ? "보내는 중…" : "올리기"}
        </Button>
      </div>
    </div>
  );
}
