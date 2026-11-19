import { NickField, StarInput } from "@/components/register/fields";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import type { ReviewFormViewProps } from "./types";

// 평가 남기기. 접힌 상태 = 「별점과 한 줄 후기 남기기」 단추, 펼친 상태 = 별 · 한 줄 후기 · 닉네임 · 닫기/올리기.
// 열림·값·오류·보내는 중과 모든 핸들러는 컨테이너(ReviewForm)가 넘긴다. fetch·checkReview·router.refresh 는 여기 없다.
// StarInput · NickField 는 register/fields 의 것을 그대로 쓴다.
// 한 줄 후기 칸은 디자인 시스템 TextField(56px · 18px) — 16px 보다 커서 아이폰 사파리가 화면을 확대하지 않는다 (REQ-W09).
// 가게 상세의 주 행동(filled)은 길찾기라 「올리기」는 두 번째 행동(tonal)이다.
export default function ReviewFormView({ open, stars, text, error, busy, onOpen, onClose, onStarsChange, onTextChange, onSubmit }: ReviewFormViewProps) {
  if (!open)
    return (
      <Button type="button" variant="outlined" size="md" onClick={onOpen} className="w-full min-w-0 px-3">
        별점과 한 줄 후기 남기기
      </Button>
    );

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border p-3">
      <div>
        <p className="mb-1 text-body-medium">가게는 어땠어요?</p>
        <StarInput value={stars} onChange={onStarsChange} hint="골라 주세요" />
      </div>
      <TextField
        label={
          <>
            한 줄 후기 <span className="text-muted-foreground">선택</span>
          </>
        }
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        maxLength={80}
        placeholder="예: 어묵 국물이 진해요"
      />
      <NickField />
      {error && <p className="text-body-small text-spicytext break-keep [overflow-wrap:anywhere]">{error}</p>}
      <div className="flex gap-2">
        <Button type="button" variant="outlined" size="md" onClick={onClose}>
          닫기
        </Button>
        <Button type="button" variant="tonal" size="md" onClick={onSubmit} disabled={busy} className="min-w-0 flex-1">
          {busy ? "보내는 중…" : "올리기"}
        </Button>
      </div>
    </div>
  );
}
