"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BOARD_CATS, MAX_POST_BODY, MAX_POST_TITLE, checkPost, type BoardCat } from "@/lib/community";
import { send, useMe } from "@/lib/me";
import { refreshOwned } from "@/lib/owned";
import StorePicker, { type PickStore } from "../lists/StorePicker";

// 떡볶이방 글쓰기: 말머리 → 제목 → 내용 → 가게 붙이기(선택). 쓰면 바로 올라간다.
export default function PostForm({ stores }: { stores: PickStore[] }) {
  const router = useRouter();
  const me = useMe();
  const [cat, setCat] = useState<BoardCat>("free");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [storeId, setStoreId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const store = stores.find((s) => s.id === storeId);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const input = { cat, title, body, storeId: storeId ?? undefined };
    const err = checkPost(input);
    if (err) return setError(err);
    setBusy(true);
    setError(null);
    const res = await send("/api/room", { action: "post", ...input });
    setBusy(false);
    if (!res.ok || !res.id) return setError(res.error ?? "올리지 못했어요");
    void refreshOwned();
    router.push(`/room/${res.id}`);
    router.refresh();
  };

  const label = "text-[13px] font-semibold text-ink2";
  return (
    <form onSubmit={submit} className="flex flex-col gap-4 px-4 pt-3 pb-10 md:px-0">
      <fieldset className="flex flex-col gap-2">
        <legend className={label}>말머리</legend>
        <div className="mt-2 flex gap-1.5">
          {(Object.entries(BOARD_CATS) as [BoardCat, string][]).map(([k, v]) => (
            <button
              key={k}
              type="button"
              aria-pressed={cat === k}
              onClick={() => setCat(k)}
              className={`h-9 rounded-full border px-3.5 text-[13px] ${cat === k ? "border-ink bg-ink font-semibold text-paper" : "border-chipline bg-surface text-ink2"}`}
            >
              {v}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="flex flex-col gap-1.5">
        <span className={label}>제목</span>
        <input
          id="post-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={MAX_POST_TITLE}
          placeholder="예: 망원 국물떡볶이 오늘 줄 없어요"
          className="h-11 rounded-xl border border-chipline bg-surface px-3 text-[15px] outline-none focus:border-ink"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className={`${label} flex justify-between`}>
          내용
          <span className="font-normal text-ink3">
            {body.length}/{MAX_POST_BODY}
          </span>
        </span>
        <textarea
          id="post-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={MAX_POST_BODY}
          rows={8}
          placeholder="떡볶이 이야기를 자유롭게 써 주세요. 남을 깎아내리는 글은 신고되면 가려져요."
          className="rounded-xl border border-chipline bg-surface px-3 py-2.5 text-[15px] leading-relaxed outline-none focus:border-ink"
        />
      </label>

      <div className="flex flex-col gap-1.5">
        <span className={label}>가게 붙이기 (선택)</span>
        {store ? (
          <p className="flex h-11 items-center gap-2 rounded-xl border border-chipline bg-chip px-3 text-[14px]">
            <span aria-hidden="true">📍</span>
            <span className="min-w-0 flex-1 truncate font-semibold">{store.name}</span>
            <button type="button" onClick={() => setStoreId(null)} className="hit text-[13px] text-ink3 underline underline-offset-2">
              빼기
            </button>
          </p>
        ) : (
          <StorePicker stores={stores} onPick={setStoreId} />
        )}
      </div>

      <p className="text-[12px] text-ink3">
        닉네임 <b className="text-ink2">{me.nick || "…"}</b> 으로 올라가요 · 이 기기에서 쓴 글은 나중에 지울 수 있어요
      </p>
      {error && (
        <p role="alert" className="rounded-xl bg-spicybg px-3 py-2 text-[13px] text-spicytext">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy} className="grid h-12 place-items-center rounded-xl bg-primary text-[15px] font-bold text-onprimary disabled:opacity-60">
        {busy ? "올리는 중…" : "올리기"}
      </button>
    </form>
  );
}
