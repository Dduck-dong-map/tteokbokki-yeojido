"use client";

import Link from "next/link";
import { distanceM, distanceText, won } from "@/lib/filters";
import { confirmedAgo, freshness } from "@/lib/freshness";
import { RICE_CAKES, STYLES } from "@/lib/taxonomy";
import type { Store } from "@/lib/types";
import { isPending } from "@/lib/wiki";
import { PendingTag, SpiceStamp, Stars, StoreThumb } from "../ui";

// 목록 한 줄 (거지맵 목록 참고 · 슬랙 10-28)
// 정보 순서(기획 팀장): 이름 → 위치(동·거리) → 떡볶이 종류 → 맵기 → 대표 가격 → 길찾기(상세에서)
type Props = {
  store: Store;
  me: { lat: number; lng: number } | null;
  now: Date;
  selected: boolean;
  onPick: () => void;
};

export default function StoreRow({ store: s, me, now, selected, onPick }: Props) {
  const stale = freshness(s, now) === "stale";
  return (
    <li id={`row-${s.id}`} className={selected ? "bg-chip" : ""}>
      <div className="flex gap-3 px-4 py-3" onClick={onPick} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && onPick()}>
        <StoreThumb photo={s.photos?.[0]} />
        <div className="min-w-0 flex-1">
          <h3 className="flex items-center gap-1.5 text-[15px] font-bold">
            <span className="truncate">{s.name}</span>
            {isPending(s, now) && <PendingTag />}
          </h3>
          <p className="truncate text-[12px] text-ink3">
            {s.dong}
            {me && <> · {distanceText(distanceM(me, s))}</>}
            <span className={stale ? " text-spicytext" : ""}> · 확인 {confirmedAgo(s.lastConfirmedAt, now)}</span>
          </p>
          <p className="mt-0.5 truncate text-[13px] text-ink2">
            {STYLES[s.style]} · {s.rice.map((r) => RICE_CAKES[r]).join("·")}
          </p>
          <div className="mt-1">
            <Stars rating={s.rating} size={12} />
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end justify-between">
          <SpiceStamp n={s.spice} size={26} faded={stale} />
          <div className="text-right">
            <b className="block text-[15px] leading-tight">{won(s.price)}</b>
            <span className="text-[11px] text-ink3">{s.menu[0].name}</span>
          </div>
        </div>
      </div>
      {selected && (
        <div className="flex gap-2 px-4 pb-3">
          <Link href={`/store/${s.id}`} className="grid h-10 flex-1 place-items-center rounded-xl bg-accent text-[14px] font-bold text-onaccent">
            자세히 · 길찾기
          </Link>
        </div>
      )}
    </li>
  );
}
