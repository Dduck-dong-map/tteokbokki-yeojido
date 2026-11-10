import StorePicker from "@/components/lists/StorePicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BOARD_CATS, MAX_POST_BODY, MAX_POST_TITLE, type BoardCat } from "@/lib/community";
import { cn } from "@/lib/utils";
import type { PostFormViewProps } from "./types";

const LABEL = "text-[13px] font-semibold text-muted-foreground";

// 떡볶이방 글쓰기: 말머리 → 제목 → 내용 → 가게 붙이기(선택) → 「올리기」.
// 값·오류·보내는 중과 모든 핸들러는 컨테이너(PostForm)가 넘긴다. checkPost·send·router·refreshOwned 는 여기 없다.
// StorePicker 는 lists/ 의 컨테이너를 그대로 쓴다(⑧에서 안쪽만 바뀜).
// 입력 글자는 16px — 더 작으면 아이폰 사파리가 화면을 저절로 확대한다 (REQ-W09).
export default function PostFormView({
  cat, title, body, store, stores, nick, busy, error,
  onCatChange, onTitleChange, onBodyChange, onStoreChange, onSubmit,
}: PostFormViewProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="flex flex-col gap-4 px-4 pt-3 pb-10 md:px-0"
    >
      <fieldset className="flex flex-col gap-2">
        <legend className={LABEL}>말머리</legend>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {(Object.entries(BOARD_CATS) as [BoardCat, string][]).map(([k, v]) => {
            const on = cat === k;
            return (
              <button
                key={k}
                type="button"
                aria-pressed={on}
                onClick={() => onCatChange(k)}
                className={cn(
                  "hit h-9 rounded-full border px-3.5 text-[13px] whitespace-nowrap",
                  on ? "border-foreground bg-foreground font-semibold text-background" : "border-input bg-card text-muted-foreground hover:bg-muted",
                )}
              >
                {v}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="post-title" className={LABEL}>
          제목
        </label>
        <Input
          id="post-title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          maxLength={MAX_POST_TITLE}
          placeholder="예: 망원 국물떡볶이 오늘 줄 없어요"
          className={cn("h-11 rounded-xl bg-card px-3 text-[16px] text-foreground md:text-[16px]")}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="post-body" className={cn(LABEL, "flex justify-between")}>
          내용
          <span className="font-normal text-muted-foreground/70">
            {body.length}/{MAX_POST_BODY}
          </span>
        </label>
        {/* shadcn Textarea 는 내용 따라 늘어나는 field-sizing:content 라 rows 가 무시된다 → 고정으로 되돌려 8줄을 지킨다 */}
        <Textarea
          id="post-body"
          value={body}
          onChange={(e) => onBodyChange(e.target.value)}
          maxLength={MAX_POST_BODY}
          rows={8}
          placeholder="떡볶이 이야기를 자유롭게 써 주세요. 남을 깎아내리는 글은 신고되면 가려져요."
          className={cn("field-sizing-fixed rounded-xl bg-card px-3 py-2.5 text-[16px] leading-relaxed text-foreground md:text-[16px]")}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className={LABEL}>가게 붙이기 (선택)</span>
        {store ? (
          <p className="flex h-11 items-center gap-2 rounded-xl border border-input bg-secondary px-3 text-[14px]">
            <span aria-hidden="true">📍</span>
            <span className="min-w-0 flex-1 truncate font-semibold text-foreground">{store.name}</span>
            <button type="button" onClick={() => onStoreChange(null)} className="hit text-[13px] text-muted-foreground/70 underline underline-offset-2">
              빼기
            </button>
          </p>
        ) : (
          <StorePicker stores={stores} onPick={onStoreChange} />
        )}
      </div>

      <p className="text-[12px] text-muted-foreground/70 break-keep [overflow-wrap:anywhere]">
        닉네임 <b className="font-semibold text-muted-foreground">{nick || "…"}</b> 으로 올라가요 · 이 기기에서 쓴 글은 나중에 지울 수 있어요
      </p>
      {error && (
        <p role="alert" className="rounded-xl bg-spicybg px-3 py-2 text-[13px] text-spicytext">
          {error}
        </p>
      )}
      <Button type="submit" disabled={busy} className={cn("h-12 rounded-xl text-[15px] font-bold")}>
        {busy ? "올리는 중…" : "올리기"}
      </Button>
    </form>
  );
}
