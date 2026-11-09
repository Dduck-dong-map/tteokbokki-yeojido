"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { addMyReport } from "@/lib/mine";
import { send } from "@/lib/me";
import type { Store } from "@/lib/types";
import { checkPatch, type StorePatch } from "@/lib/wiki";
import EditFormView from "./EditFormView";
import type { EditValues } from "./types";

// 정보 고치기 컨테이너 (리팩토링 계획 2026-11-09 · 7-1 형태 2).
// 누구나 고칠 수 있고 바로 반영된다. 무엇을 바꿨는지는 변경 이력에 남는다.
// 입력값은 EditValues 하나로 묶어 들고(정리 보고서 3-4), 검사·보내기·이동은 여기서 끝낸다. 그리는 일은 EditFormView.
export default function EditForm({ store, stores }: { store: Store; stores: Store[] }) {
  const router = useRouter();
  const [values, setValues] = useState<EditValues>({
    name: store.name,
    address: store.address,
    grade: store.grade,
    rice: store.rice,
    style: store.style,
    spice: store.spice,
    menu: store.menu,
    hours: store.hours ?? null,
    usage: store.usage,
    memo: store.memo ?? "",
    photos: [], // 새로 더한 사진 id 만
    pos: null, // 옮긴 위치 (moveOpen 일 때만 보낸다)
  });
  const [moveOpen, setMoveOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const submit = async () => {
    const { photos, pos, ...rest } = values;
    const patch: StorePatch = { ...rest, ...(photos.length ? { addPhotos: photos } : {}), ...(moveOpen && pos ? pos : {}) };
    const e = checkPatch(patch);
    if (e) return setError(e);
    setSending(true);
    const res = await send(`/api/stores/${store.id}`, { action: "edit", patch });
    setSending(false);
    if (!res.ok) return setError(res.error ?? "보내지 못했어요. 잠시 뒤 다시 해 주세요");
    addMyReport({ kind: "edit", storeId: store.id, name: values.name.trim() });
    router.replace(`/store/${store.id}`);
    router.refresh();
  };

  // 상세의 「이 집 소개글 쓰기」로 오면 그 칸부터 (View 가 #intro 구역과 #edit-intro 칸을 그린다)
  useEffect(() => {
    if (window.location.hash !== "#intro") return;
    document.getElementById("intro")?.scrollIntoView({ block: "start" });
    document.getElementById("edit-intro")?.focus({ preventScroll: true });
  }, []);

  return (
    <EditFormView
      store={store}
      stores={stores}
      values={values}
      moveOpen={moveOpen}
      error={error}
      sending={sending}
      onChange={(p) => setValues((v) => ({ ...v, ...p }))}
      onOpenMove={() => setMoveOpen(true)}
      onSubmit={submit}
    />
  );
}
