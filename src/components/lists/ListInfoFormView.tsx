import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LIST_VISIBILITY, MAX_LIST_DESC, MAX_LIST_TITLE, type ListVisibility } from "@/lib/community";
import { cn } from "@/lib/utils";
import type { ListInfoFormViewProps } from "./types";

// 리스트 이름 · 설명 · 공개 범위 폼의 마크업 (새로 만들 때와 고칠 때 같이 쓴다).
// 값·오류·보내는 중·검사(checkListInfo)는 컨테이너(ListInfoForm / useListInfo)가 넘긴다. 여기서는 preventDefault 한 줄만 한다.
// 입력 글자는 폰에서 16px — 더 작으면 아이폰 사파리가 화면을 저절로 확대한다 (REQ-W09).
export default function ListInfoFormView({ values, error, busy, submitLabel = "저장", onChange, onSubmit, onCancel }: ListInfoFormViewProps) {
  return (
    <form
      className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3.5"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <label className="flex flex-col gap-1">
        <span className="text-[13px] font-semibold text-muted-foreground">리스트 이름</span>
        <Input
          id="list-title"
          value={values.title}
          onChange={(e) => onChange({ title: e.target.value })}
          maxLength={MAX_LIST_TITLE}
          placeholder="예: 비 오는 날 국물떡볶이"
          className={cn("h-11 rounded-xl bg-card px-3 text-[16px] md:text-[15px]")}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[13px] font-semibold text-muted-foreground">설명 (선택)</span>
        <Textarea
          id="list-desc"
          value={values.desc}
          onChange={(e) => onChange({ desc: e.target.value })}
          maxLength={MAX_LIST_DESC}
          rows={2}
          placeholder="어떤 기준으로 골랐는지 한두 줄"
          className={cn("rounded-xl bg-card px-3 py-2 text-[16px] md:text-[14px]")}
        />
      </label>
      <fieldset className="flex flex-wrap gap-1.5">
        <legend className="mb-1 text-[13px] font-semibold text-muted-foreground">공개 범위</legend>
        {(Object.entries(LIST_VISIBILITY) as [ListVisibility, string][]).map(([k, v]) => (
          <button
            key={k}
            type="button"
            aria-pressed={values.visibility === k}
            onClick={() => onChange({ visibility: k })}
            className={cn("hit h-9 rounded-full border px-3.5 text-[13px]", values.visibility === k ? "border-primary bg-primary font-semibold text-primary-foreground" : "border-input bg-card text-muted-foreground")}
          >
            {v}
          </button>
        ))}
        <p className="w-full text-[12px] text-muted-foreground/70">
          {values.visibility === "public" ? "「모두의 리스트」에 올라가 누구나 보고 추천할 수 있어요." : "목록에는 안 나오고, 링크를 받은 사람만 볼 수 있어요."}
        </p>
      </fieldset>
      {error && (
        <p role="alert" className="text-[13px] text-spicytext">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className={cn("h-10 rounded-xl border-input bg-card px-4 text-[14px] font-normal text-muted-foreground")}>
            그만두기
          </Button>
        )}
        <Button type="submit" disabled={busy} className={cn("h-10 rounded-xl px-5 text-[14px] font-bold")}>
          {busy ? "저장하는 중…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
