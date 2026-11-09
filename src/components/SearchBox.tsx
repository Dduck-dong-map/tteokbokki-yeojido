"use client";

import { setSearch, useSearch } from "@/lib/search";
import SearchBoxView from "@/components/layout/SearchBoxView";

// 가게 검색칸 컨테이너: 화면 안 검색어 저장소(lib/search)를 읽고 쓰는 일만 하고, 그리기는 SearchBoxView 에 맡긴다.
export default function SearchBox() {
  const value = useSearch();
  return <SearchBoxView value={value} onChange={setSearch} onClear={() => setSearch("")} />;
}
