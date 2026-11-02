"use client";

import { useState } from "react";
import { useSaved } from "@/lib/mine";

// 가게 상세 머리칸 오른쪽 ♡ — 누르면 「내 맛지도」(아래 메뉴 셋째 탭)에 모인다. 보드 N3-03·N3-05 (11-02).
export default function SaveButton({ id, name }: { id: string; name: string }) {
  const { on, toggle } = useSaved(id);
  const [toast, setToast] = useState<string | null>(null);

  const press = () => {
    const now = toggle();
    setToast(now ? "내 맛지도에 담았어요" : "내 맛지도에서 뺐어요");
    setTimeout(() => setToast(null), 1400);
  };

  return (
    <>
      <button
        type="button"
        onClick={press}
        aria-pressed={on}
        aria-label={on ? `${name} 저장 취소` : `${name} 내 맛지도에 저장`}
        className={`grid h-10 w-10 place-items-center rounded-full text-[22px] leading-none transition-transform active:scale-90 ${on ? "text-fab" : "text-ink3"}`}
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
