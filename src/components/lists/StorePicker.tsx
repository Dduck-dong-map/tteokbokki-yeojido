"use client";

import { useState } from "react";

export type PickStore = { id: string; name: string; dong: string };

const norm = (s: string) => s.replace(/\s+/g, "").toLowerCase();

// 가게 이름·동네로 찾아 고르기 (떡볶이방 글에 가게 붙이기 · 리스트에 가게 넣기)
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
    <div>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        autoFocus={autoFocus}
        className="h-11 w-full rounded-xl border border-chipline bg-surface px-3 text-[14px] outline-none focus:border-ink"
      />
      {query && (
        <ul className="mt-1.5 divide-y divide-line rounded-xl border border-line bg-surface">
          {hits.length ? (
            hits.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => {
                    onPick(s.id);
                    setQ("");
                  }}
                  className="flex h-11 w-full items-center gap-2 px-3 text-left text-[14px] hover:bg-chip"
                >
                  <span className="min-w-0 flex-1 truncate font-semibold">{s.name}</span>
                  <span className="shrink-0 text-[12px] text-ink3">{s.dong}</span>
                </button>
              </li>
            ))
          ) : (
            <li className="px-3 py-3 text-[13px] text-ink3">찾는 가게가 없어요. 지도에 없는 집이면 먼저 등록해 주세요.</li>
          )}
        </ul>
      )}
    </div>
  );
}
