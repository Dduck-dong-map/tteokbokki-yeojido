"use client";

import { setSearch, useSearch } from "@/lib/search";

// 가게 검색칸. 입력 글자는 16px (더 작으면 아이폰 사파리가 화면을 저절로 확대한다)
export default function SearchBox() {
  const q = useSearch();
  return (
    <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-xl border border-chipline bg-surface px-3">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="shrink-0 text-ink3" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        value={q}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="가게 이름이나 동네로 찾기"
        className="min-w-0 flex-1 bg-transparent text-[16px] text-ink outline-none placeholder:text-ink3"
        aria-label="가게 검색"
      />
      {q && (
        <button type="button" onClick={() => setSearch("")} aria-label="검색어 지우기" className="text-ink3">
          ×
        </button>
      )}
    </label>
  );
}
