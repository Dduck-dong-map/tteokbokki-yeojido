"use client";

import { useState } from "react";
import { useSaved } from "@/lib/mine";
import SaveButtonView from "./SaveButtonView";

// 가게 상세 머리칸 오른쪽 ♡ — 누르면 「내 맛지도」(아래 메뉴 셋째 탭)에 모인다. 보드 N3-03·N3-05 (11-02).
// 컨테이너: localStorage(lib/mine) 토글과 토스트 타이머만 맡고, 마크업은 SaveButtonView 가 그린다.
export default function SaveButton({ id, name }: { id: string; name: string }) {
  const { on, toggle } = useSaved(id);
  const [toast, setToast] = useState<string | null>(null);

  const press = () => {
    const now = toggle();
    setToast(now ? "찜했어요 · 내 맛지도 「찜한 가게」에 있어요" : "찜을 풀었어요");
    setTimeout(() => setToast(null), 1400);
  };

  return <SaveButtonView name={name} on={on} toast={toast} onPress={press} />;
}
