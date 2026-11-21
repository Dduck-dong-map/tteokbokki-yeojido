"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { checkPost, type BoardCat } from "@/lib/community";
import { send, useMe } from "@/lib/me";
import { refreshOwned } from "@/lib/owned";
import type { PickStore } from "../lists/StorePicker";
import PostFormView from "./PostFormView";

// 떡볶이방 글쓰기 컨테이너 (리팩토링 계획 2026-11-09 · 7-1 형태 2).
// 상태·checkPost·send·refreshOwned·router 는 여기, 마크업은 PostFormView 가 맡는다(계약: ./types.ts).
// submit 은 이벤트를 받지 않는다 — form 의 preventDefault 는 View 가 한다.
export default function PostForm({ stores }: { stores: PickStore[] }) {
  const router = useRouter();
  const me = useMe();
  const [cat, setCat] = useState<BoardCat>("free");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const store = stores.find((s) => s.id === storeId) ?? null;

  const submit = async () => {
    const input = { cat, title, body, storeId: storeId ?? undefined, photos };
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

  return (
    <PostFormView
      cat={cat}
      title={title}
      body={body}
      photos={photos}
      store={store}
      stores={stores}
      nick={me.nick}
      busy={busy}
      error={error}
      onCatChange={setCat}
      onTitleChange={setTitle}
      onBodyChange={setBody}
      onPhotosChange={setPhotos}
      onStoreChange={setStoreId}
      onSubmit={submit}
    />
  );
}
