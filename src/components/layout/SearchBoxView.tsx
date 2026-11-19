import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
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
        className="min-w-0 flex-1 bg-transparent text-body-medium text-foreground outline-none placeholder:text-muted-foreground/70"
        aria-label="가게 검색"
      />
      {value && (
        // 검색칸(높이 40~44px) 안이라 보이는 크기는 32px 로 줄인다. 누르는 영역은 icon-md 의 .hit-target 이 넓힌다
        <Button type="button" variant="text" size="icon-md" onClick={onClear} aria-label="검색어 지우기" className="size-8 text-muted-foreground/70 hover:text-foreground">
          <X className="size-4" aria-hidden="true" />
        </Button>
      )}
    </label>
  );
}
