"use client";

import Link from "next/link";
import { useState } from "react";
import { BOARD_CATS, timeAgo, type BoardCat, type Post } from "@/lib/community";
import { SampleRibbon } from "../ui";

type Cat = BoardCat | "all";
const CATS: [Cat, string][] = [["all", "전체"], ...(Object.entries(BOARD_CATS) as [BoardCat, string][])];

// 떡볶이방 글 목록: 말머리 칩 → 최신 글부터. 줄 하나 = 말머리 · 제목 · [댓글 수] / 닉네임 · 시각 · 붙인 가게
export default function RoomBoard({ posts, storeNames, nowIso }: { posts: Post[]; storeNames: Record<string, string>; nowIso: string }) {
  const [cat, setCat] = useState<Cat>("all");
  const now = new Date(nowIso);
  const shown = cat === "all" ? posts : posts.filter((p) => p.cat === cat);
  const sample = posts.some((p) => p.isSample);

  return (
    <>
      <header className="z-10 border-b border-line bg-bar px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-3 max-md:sticky max-md:top-0 md:border-0 md:bg-transparent md:px-0 md:pt-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-[18px] font-bold md:text-[20px]">떡볶이방</h1>
            <p className="mt-0.5 text-[12px] text-ink3">떡볶이 이야기 나누는 곳 · 가입 없이 닉네임으로</p>
          </div>
          <Link href="/room/write" className="grid h-10 shrink-0 place-items-center rounded-xl bg-primary px-4 text-[14px] font-bold text-onprimary">
            글쓰기
          </Link>
        </div>
        <div className="mt-3 flex gap-1.5 overflow-x-auto [scrollbar-width:none]" role="tablist" aria-label="말머리">
          {CATS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={cat === key}
              onClick={() => setCat(key)}
              className={`h-8 shrink-0 rounded-full border px-3 text-[13px] ${cat === key ? "border-ink bg-ink font-semibold text-paper" : "border-chipline bg-surface text-ink2"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>
      {sample && (
        <div className="flex justify-center pt-3">
          <SampleRibbon />
        </div>
      )}

      <main className="flex-1 pb-6">
        {shown.length ? (
          <ul className="divide-y divide-line md:mt-2 md:rounded-2xl md:border md:border-line md:bg-surface">
            {shown.map((p) => (
              <li key={p.id}>
                <Link href={`/room/${p.id}`} className="block px-4 py-3.5 hover:bg-chip/60">
                  <p className="flex items-center gap-1.5">
                    <span className="shrink-0 rounded border border-chipline px-1.5 text-[11px] leading-5 text-ink2">{BOARD_CATS[p.cat]}</span>
                    <span className="min-w-0 truncate text-[15px] font-semibold">{p.title}</span>
                    {p.comments > 0 && <span className="shrink-0 text-[13px] font-bold text-accent">[{p.comments}]</span>}
                  </p>
                  <p className="mt-1 truncate text-[12px] text-ink3">
                    {p.who} · {timeAgo(p.at, now)}
                    {p.likes > 0 && <> · 👍 {p.likes}</>}
                    {p.storeId && storeNames[p.storeId] && <> · 📍 {storeNames[p.storeId]}</>}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-16 text-center text-[13px] leading-relaxed text-ink3">
            아직 글이 없어요.
            <br />
            <Link href="/room/write" className="mt-3 inline-block font-semibold text-ink underline underline-offset-4">
              첫 글 쓰기
            </Link>
          </p>
        )}
      </main>
    </>
  );
}
