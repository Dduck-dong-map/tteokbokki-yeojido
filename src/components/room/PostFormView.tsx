import { MapPin } from "lucide-react";
import StorePicker from "@/components/lists/StorePicker";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BOARD_CATS, MAX_POST_BODY, MAX_POST_TITLE, type BoardCat } from "@/lib/community";
import { cn } from "@/lib/utils";
import type { PostFormViewProps } from "./types";

const LABEL = "text-caption font-semibold text-muted-foreground";

// 떡볶이방 글쓰기: 말머리 → 제목 → 내용 → 가게 붙이기(선택) → 「올리기」.
// 값·오류·보내는 중과 모든 핸들러는 컨테이너(PostForm)가 넘긴다. checkPost·send·router·refreshOwned 는 여기 없다.
// StorePicker 는 lists/ 의 컨테이너를 그대로 쓴다(⑧에서 안쪽만 바뀜).
// 입력칸은 디자인 시스템 칸(variant="field" · 18px) — 16px 보다 작으면 아이폰 사파리가 화면을 저절로 확대한다 (REQ-W09).
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
        <div className="mt-2 flex flex-wrap gap-2">
          {/* 하나만 고른다: 누를 때마다 그 말머리를 알린다(켜진 것을 다시 눌러도 그대로) */}
          {(Object.entries(BOARD_CATS) as [BoardCat, string][]).map(([k, v]) => (
            <Chip key={k} shape="pill" selected={cat === k} onClick={() => onCatChange(k)}>
              {v}
            </Chip>
          ))}
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
          variant="field"
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
          variant="field"
          className="field-sizing-fixed"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className={LABEL}>가게 붙이기 (선택)</span>
        {store ? (
          <p className="flex min-h-11 items-center gap-2 rounded-xl border border-input bg-secondary pr-1 pl-3 text-caption">
            <MapPin className="size-5 shrink-0 text-muted-foreground" strokeWidth={2} aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate font-semibold text-foreground">{store.name}</span>
            <Button type="button" variant="text" size="compact" onClick={() => onStoreChange(null)}>
              빼기
            </Button>
          </p>
        ) : (
          <StorePicker stores={stores} onPick={onStoreChange} />
        )}
      </div>

      <p className="text-body-small text-muted-foreground/70 break-keep [overflow-wrap:anywhere]">
        닉네임 <b className="font-semibold text-muted-foreground">{nick || "…"}</b> 으로 올라가요 · 이 기기에서 쓴 글은 나중에 지울 수 있어요
      </p>
      {error && (
        <p role="alert" className="rounded-xl bg-spicybg px-3 py-2 text-body-small text-spicytext">
          {error}
        </p>
      )}
      <Button type="submit" variant="filled" size="xl" disabled={busy}>
        {busy ? "올리는 중…" : "올리기"}
      </Button>
    </form>
  );
}
