"use client";

import { useState } from "react";
import StorePickerView from "./StorePickerView";

export type PickStore = { id: string; name: string; dong: string };

const norm = (s: string) => s.replace(/\s+/g, "").toLowerCase();

// 가게 이름·동네로 찾아 고르기의 컨테이너 (리팩토링 계획 2026-11-09 · 7-1 형태 2).
// 떡볶이방 글에 가게 붙이기(PostForm) · 리스트에 가게 넣기(ListPanelView)가 쓴다. props 와 PickStore 는 그대로다.
// 여기서는 검색어 상태와 거르기(이름·동, exclude, 8개)만 하고, 마크업은 StorePickerView 가 맡는다(계약: ./types.ts).
export default function StorePicker({
  stores,
  onPick,
  exclude,
  placeholder = "가게 이름이나 동네로 찾기",
  autoFocus = false,
}: {
  stores: PickStore[];
  onPick: (id: string) => void;
  exclude?: Set<string>;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const [q, setQ] = useState("");
  const query = norm(q);
  const hits = query ? stores.filter((s) => !exclude?.has(s.id) && (norm(s.name).includes(query) || norm(s.dong).includes(query))).slice(0, 8) : [];

  return (
    <StorePickerView
      query={q}
      hits={hits}
      placeholder={placeholder}
      autoFocus={autoFocus}
      onQueryChange={setQ}
      onPick={(id) => {
        onPick(id);
        setQ("");
      }}
    />
  );
}
