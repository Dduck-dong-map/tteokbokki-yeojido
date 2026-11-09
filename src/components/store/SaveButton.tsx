"use client";

import { useState } from "react";
import { useSaved } from "@/lib/mine";

// 가게 상세 머리칸 오른쪽 ♡ — 누르면 「내 맛지도」(아래 메뉴 셋째 탭)에 모인다. 보드 N3-03·N3-05 (11-02).
export default function SaveButton({ id, name }: { id: string; name: string }) {
  const { on, toggle } = useSaved(id);
  const [toast, setToast] = useState<string | null>(null);

  const press = () => {
    const now = toggle();
    setToast(now ? "찜했어요 · 내 맛지도 「찜한 가게」에 있어요" : "찜을 풀었어요");
    setTimeout(() => setToast(null), 1400);
  };

  return (
    <>
      <button
        type="button"
        onClick={press}
        aria-pressed={on}
        aria-label={on ? `${name} 찜 취소` : `${name} 찜하기`}
        className={`grid h-11 w-11 place-items-center rounded-full text-[22px] leading-none transition-transform active:scale-90 ${on ? "text-fab" : "text-ink3"}`}
      >
        {on ? "♥" : "♡"}
      </button>
      {toast && (
        <div role="status" className="pointer-events-none fixed inset-x-0 bottom-24 z-30 flex justify-center">
          <span className="rounded-full bg-ink/85 px-4 py-2 text-[13px] font-medium text-paper">{toast}</span>
        </div>
      )}
    </>
  );
}
