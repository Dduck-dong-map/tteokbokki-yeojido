"use client";

import Link from "next/link";
import { useState } from "react";
import { MAX_LIST_TITLE } from "@/lib/community";
import { send } from "@/lib/me";
import { refreshOwned, useOwned } from "@/lib/owned";

// 가게 상세 「리스트에 담기」: 내 리스트마다 넣기/빼기, 없으면 이 가게로 새 리스트를 바로 만든다 (11-08)
export default function AddToList({ storeId }: { storeId: string }) {
  const { data, loaded } = useOwned();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const count = data.lists.filter((l) => l.storeIds.includes(storeId)).length;

  const toggle = async (listId: string, has: boolean) => {
    setBusy(listId);
    const res = await send(`/api/lists/${listId}`, { action: has ? "remove" : "add", storeId });
    await refreshOwned();
    setBusy(null);
    setMsg(res.ok ? null : (res.error ?? "담지 못했어요"));
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return setMsg("리스트 이름을 써 주세요");
    setBusy("new");
    const res = await send("/api/lists", { title, visibility: "public", storeIds: [storeId] });
    await refreshOwned();
    setBusy(null);
    if (!res.ok) return setMsg(res.error ?? "만들지 못했어요");
    setTitle("");
    setMsg(`「${title.trim()}」 리스트를 만들고 담았어요`);
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className={`flex h-11 w-full items-center justify-center gap-1.5 rounded-xl border text-[14px] font-bold ${count ? "border-accent text-accent" : "border-chipline text-ink"} bg-surface`}
      >
        {count ? `✓ 내 리스트 ${count}곳에 담김` : "＋ 내 리스트에 담기"}
      </button>
      {open && (
        <div className="mt-2 flex flex-col gap-2 rounded-xl border border-line bg-surface p-3">
          {!loaded ? (
            <p className="text-[13px] text-ink3">내 리스트를 불러오는 중…</p>
          ) : data.lists.length ? (
            <ul className="flex flex-col gap-1">
              {data.lists.map((l) => {
                const has = l.storeIds.includes(storeId);
                return (
                  <li key={l.id}>
                    <button
                      type="button"
                      disabled={busy === l.id}
                      onClick={() => toggle(l.id, has)}
                      aria-pressed={has}
                      className="flex h-11 w-full items-center gap-2 rounded-lg px-2 text-left text-[14px] hover:bg-chip disabled:opacity-50"
                    >
                      <span className={`grid h-5 w-5 shrink-0 place-items-center rounded border text-[12px] ${has ? "border-accent bg-accent text-onaccent" : "border-chipline"}`} aria-hidden="true">
                        {has ? "✓" : ""}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-semibold">{l.title}</span>
                      <span className="shrink-0 text-[12px] text-ink3">{l.storeIds.length}곳</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-[13px] text-ink3">아직 만든 리스트가 없어요. 이 가게로 첫 리스트를 만들어 보세요.</p>
          )}
          <form onSubmit={create} className="flex gap-2">
            <input
              id="new-list-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={MAX_LIST_TITLE}
              placeholder="새 리스트 이름"
              aria-label="새 리스트 이름"
              className="h-10 min-w-0 flex-1 rounded-lg border border-chipline bg-surface px-3 text-[14px] outline-none focus:border-ink"
            />
            <button type="submit" disabled={busy === "new"} className="h-10 shrink-0 rounded-lg bg-primary px-3 text-[13px] font-bold text-onprimary disabled:opacity-60">
              만들고 담기
            </button>
          </form>
          {msg && (
            <p role="status" className="text-[12px] text-ink3">
              {msg}
            </p>
          )}
          <Link href="/mine?tab=my" className="self-end text-[12px] text-ink3 underline underline-offset-2">
            내 리스트 모두 보기
          </Link>
        </div>
      )}
    </div>
  );
}
