"use client";

import Link from "next/link";
import { useRef } from "react";
import { distanceM, distanceText, won } from "@/lib/filters";
import { confirmedAgo, freshness, isOpenNow } from "@/lib/freshness";
import { GRADES, RICE_CAKES, STYLES } from "@/lib/taxonomy";
import type { Store } from "@/lib/types";
import { SpiceStamp, Tag } from "../ui";

type Props = {
  store: Store;
  me: { lat: number; lng: number } | null;
  onNext: () => void; // 옆으로 밀면 가까운 다음 가게
  onPrev: () => void;
  hasPrev: boolean;
};

export default function StoreCard({ store: s, me, onNext, onPrev, hasPrev }: Props) {
  const now = new Date();
  const fresh = freshness(s, now);
  const open = isOpenNow(s.hours, now);
  const startX = useRef<number | null>(null);

  return (
    <article
      className="sheet-up rounded-2xl border border-line bg-surface p-4 shadow-[0_6px_24px_var(--cardshadow)]"
      onPointerDown={(e) => (startX.current = e.clientX)}
      onPointerUp={(e) => {
        if (startX.current === null) return;
        const dx = e.clientX - startX.current;
        startX.current = null;
        if (dx < -50) onNext();
        else if (dx > 50 && hasPrev) onPrev();
      }}
    >
      <div className="flex items-start gap-3">
        <SpiceStamp n={s.spice} size={40} faded={fresh === "stale"} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[12px] text-ink3">
            <span>{GRADES[s.grade]}</span>
            <span>·</span>
            <span className={open ? "font-semibold text-accent" : ""}>{open ? "영업 중" : "지금 닫힘"}</span>
            {me && (
              <>
                <span>·</span>
                <span>{distanceText(distanceM(me, s))}</span>
              </>
            )}
          </div>
          <h2 className="truncate text-[17px] font-bold">{s.name}</h2>
          <p className="text-[14px] text-ink2">
            {s.menu[0].name} <b className="text-ink">{won(s.price)}</b>
            {s.spiceLabel && <span className="text-ink3"> · 가게 단계 「{s.spiceLabel}」</span>}
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Tag>{STYLES[s.style]}</Tag>
        {s.rice.map((r) => (
          <Tag key={r}>{RICE_CAKES[r]}</Tag>
        ))}
        {s.spice >= 4 && <Tag spicy>매운 편</Tag>}
      </div>
      {fresh === "stale" && (
        <p className="mt-2 rounded-lg bg-chip px-2.5 py-1.5 text-[12px] text-ink2">
          오래된 정보일 수 있어요 · 마지막 확인 {confirmedAgo(s.lastConfirmedAt, now)}
        </p>
      )}
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={onPrev} disabled={!hasPrev} className="h-10 w-10 rounded-xl border border-chipline text-ink2 disabled:opacity-30" aria-label="이전 가게">
          ‹
        </button>
        <Link href={`/store/${s.id}`} className="grid h-10 flex-1 place-items-center rounded-xl bg-primary text-[15px] font-bold text-onprimary">
          자세히 보기
        </Link>
        <button type="button" onClick={onNext} className="h-10 w-10 rounded-xl border border-chipline text-ink2" aria-label="가까운 다음 가게">
          ›
        </button>
      </div>
    </article>
  );
}
