"use client";

import { useState } from "react";
import { send } from "@/lib/me";
import { refreshOwned, useOwned } from "@/lib/owned";
import AddToListView from "./AddToListView";

// 가게 상세 「리스트에 담기」의 컨테이너 (리팩토링 계획 2026-11-09 · 7-1 형태 2).
// 내 리스트마다 넣기/빼기, 없으면 이 가게로 새 리스트를 바로 만든다 (11-08).
// 여기서는 상태·fetch·refreshOwned 만 다루고, 마크업은 AddToListView 가 맡는다(계약: ./types.ts).
export default function AddToList({ storeId }: { storeId: string }) {
  const { data, loaded } = useOwned();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const has = (listId: string) => data.lists.find((l) => l.id === listId)?.storeIds.includes(storeId) ?? false;
  const count = data.lists.filter((l) => l.storeIds.includes(storeId)).length;

  const toggle = async (listId: string, already: boolean) => {
    setBusy(listId);
    const res = await send(`/api/lists/${listId}`, { action: already ? "remove" : "add", storeId });
    await refreshOwned();
    setBusy(null);
    setMsg(res.ok ? null : (res.error ?? "담지 못했어요"));
  };

  // preventDefault 는 View 의 <form onSubmit> 이 맡고, 여기는 이벤트 없이 부른다
  const create = async () => {
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
    <AddToListView
      lists={data.lists}
      loaded={loaded}
      open={open}
      title={title}
      busyId={busy}
      message={msg}
      count={count}
      has={has}
      onToggleOpen={() => setOpen(!open)}
      onToggleList={(id) => toggle(id, has(id))}
      onTitleChange={setTitle}
      onCreate={create}
    />
  );
}
