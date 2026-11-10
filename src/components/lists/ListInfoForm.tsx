"use client";

import { useState } from "react";
import { checkListInfo, type ListVisibility, type PlaceList } from "@/lib/community";
import ListInfoFormView from "./ListInfoFormView";
import type { ListInfoFormViewProps, ListInfoValues } from "./types";

// 이름 · 설명 · 공개 범위 폼의 컨테이너 (리팩토링 계획 2026-11-09 · 7-1 형태 2).
// 상태·검사(checkListInfo)·보내는 중만 다루고, 마크업은 ListInfoFormView 가 맡는다(계약: ./types.ts).
// MinePage(새 리스트 만들기)와 ListPanel(이름·설명 고치기)이 같이 쓴다.

type InfoInitial = Pick<PlaceList, "title" | "desc" | "visibility">;

// 폼 상태를 ListInfoFormViewProps 모양으로 만들어 준다.
// ListPanel 은 이 훅의 결과를 ListPanelView 의 info 로 그대로 넘기고, ListInfoForm 은 View 에 바로 펼친다.
export function useListInfo(
  initial: InfoInitial | undefined,
  onSave: (v: ListInfoValues) => void | Promise<void>,
  options: { submitLabel?: string; onCancel?: () => void } = {},
): ListInfoFormViewProps {
  const [values, setValues] = useState<ListInfoValues>({
    title: initial?.title ?? "",
    desc: initial?.desc ?? "",
    visibility: initial?.visibility ?? "public",
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    const err = checkListInfo(values);
    if (err) return setError(err);
    setError(null);
    setBusy(true);
    await onSave(values);
    setBusy(false);
  };

  return {
    values,
    error,
    busy,
    submitLabel: options.submitLabel,
    onChange: (patch) => setValues((v) => ({ ...v, ...patch })),
    onSubmit,
    onCancel: options.onCancel,
  };
}

// 이름 · 설명 · 공개 범위 (새로 만들 때와 고칠 때 같이 쓴다). 시그니처는 옛 ListView.tsx 의 것을 그대로 둔다.
export function ListInfoForm({
  list,
  onSave,
  onCancel,
  submitLabel = "저장",
}: {
  list?: InfoInitial;
  onSave: (v: { title: string; desc: string; visibility: ListVisibility }) => void | Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
}) {
  const info = useListInfo(list, onSave, { submitLabel, onCancel });
  return <ListInfoFormView {...info} />;
}
