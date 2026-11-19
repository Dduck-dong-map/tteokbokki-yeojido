import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { TextAreaField, TextField } from "@/components/ui/text-field";
import { LIST_VISIBILITY, MAX_LIST_DESC, MAX_LIST_TITLE, type ListVisibility } from "@/lib/community";
import type { ListInfoFormViewProps } from "./types";

// 리스트 이름 · 설명 · 공개 범위 폼의 마크업 (새로 만들 때와 고칠 때 같이 쓴다).
// 값·오류·보내는 중·검사(checkListInfo)는 컨테이너(ListInfoForm / useListInfo)가 넘긴다. 여기서는 preventDefault 한 줄만 한다.
// 칸은 디자인 시스템 TextField(56px · 18px) — 16px 보다 커서 아이폰 사파리가 화면을 확대하지 않는다 (REQ-W09).
// 공개 범위는 하나 고르기라 Chip 의 onChange 가 true 일 때만 받는다. 저장 단추가 이 폼의 주 행동(filled)이다.
export default function ListInfoFormView({ values, error, busy, submitLabel = "저장", onChange, onSubmit, onCancel }: ListInfoFormViewProps) {
  return (
    <form
      className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3.5"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <TextField
        id="list-title"
        label="리스트 이름"
        value={values.title}
        onChange={(e) => onChange({ title: e.target.value })}
        maxLength={MAX_LIST_TITLE}
        placeholder="예: 비 오는 날 국물떡볶이"
      />
      <TextAreaField
        id="list-desc"
        label="설명 (선택)"
        value={values.desc}
        onChange={(e) => onChange({ desc: e.target.value })}
        maxLength={MAX_LIST_DESC}
        rows={2}
        placeholder="어떤 기준으로 골랐는지 한두 줄"
      />
      <fieldset className="flex flex-wrap gap-2">
        <legend className="mb-1.5 text-body-medium text-foreground">공개 범위</legend>
        {(Object.entries(LIST_VISIBILITY) as [ListVisibility, string][]).map(([k, v]) => (
          <Chip
            key={k}
            type="button"
            shape="pill"
            selected={values.visibility === k}
            onChange={(on) => {
              if (on) onChange({ visibility: k });
            }}
          >
            {v}
          </Chip>
        ))}
        <p className="w-full text-body-small text-muted-foreground/70 break-keep [overflow-wrap:anywhere]">
          {values.visibility === "public" ? "「모두의 리스트」에 올라가 누구나 보고 추천할 수 있어요." : "목록에는 안 나오고, 링크를 받은 사람만 볼 수 있어요."}
        </p>
      </fieldset>
      {error && (
        <p role="alert" className="text-body-small text-spicytext break-keep [overflow-wrap:anywhere]">
          {error}
        </p>
      )}
      <div className="flex flex-wrap justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outlined" size="md" onClick={onCancel}>
            그만두기
          </Button>
        )}
        <Button type="submit" variant="filled" size="md" disabled={busy}>
          {busy ? "저장하는 중…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
