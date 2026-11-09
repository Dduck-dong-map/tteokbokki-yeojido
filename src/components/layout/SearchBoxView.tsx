import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SearchBoxViewProps } from "./types";

// 가게 검색칸. 돋보기 · 입력칸 · 지우기 단추. 검색어와 핸들러는 컨테이너(SearchBox.tsx)가 넘긴다.
// 입력 글자는 16px (더 작으면 아이폰 사파리가 화면을 저절로 확대한다 — REQ-W09).
// shadcn Input 은 자체 테두리·포커스 링을 가져 label 테두리 안에 넣으면 겹치므로 투명한 <input> 을 그대로 둔다.
export default function SearchBoxView({ value, onChange, onClear }: SearchBoxViewProps) {
  return (
    <label className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-xl border border-input bg-card px-3 focus-within:border-ring md:h-10">
      <Search size={16} strokeWidth={2.2} className="shrink-0 text-muted-foreground/70" aria-hidden="true" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="가게 이름이나 동네로 찾기"
        className="min-w-0 flex-1 bg-transparent text-[16px] text-foreground outline-none placeholder:text-muted-foreground/70"
        aria-label="가게 검색"
      />
      {value && (
        <button
          type="button"
          onClick={onClear}
          aria-label="검색어 지우기"
          className={cn("hit grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted-foreground/70 hover:bg-muted hover:text-foreground")}
        >
          <X size={16} aria-hidden="true" />
        </button>
      )}
    </label>
  );
}
