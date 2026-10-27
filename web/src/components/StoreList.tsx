import Link from "next/link";
import { byRecentlyConfirmed, won } from "@/lib/filters";
import { confirmedAgo, freshness } from "@/lib/freshness";
import { RICE_CAKES, SPICE_LEVELS, STYLES } from "@/lib/taxonomy";
import type { Store } from "@/lib/types";
import { SpiceStamp, Tag } from "./ui";

// 목록: 지도 없이도 읽히는 글 목록 (검색엔진·지도 API 한도 대비, 기획안 13절)
// 365일 넘은 가게는 내리고, 최근 확인된 가게를 위에 둔다.
export function visibleStores(stores: Store[], now: Date) {
  return stores.filter((s) => freshness(s, now) !== "expired").sort(byRecentlyConfirmed);
}

export default function StoreList({ stores, now }: { stores: Store[]; now: Date }) {
  if (!stores.length) return <p className="px-4 py-10 text-center text-[14px] text-ink3">아직 등록된 가게가 없어요. 제보해 주세요!</p>;
  return (
    <ul className="divide-y divide-line">
      {stores.map((s) => {
        const stale = freshness(s, now) === "stale";
        return (
          <li key={s.id}>
            <Link href={`/store/${s.id}`} className="flex gap-3 px-4 py-3.5">
              <SpiceStamp n={s.spice} size={34} faded={stale} />
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-[15px] font-bold">{s.name}</h3>
                <p className="text-[13px] text-ink2">
                  {s.menu[0].name} {won(s.price)} · 맵기 {s.spice} ({SPICE_LEVELS[s.spice].ref.replace(" 정도", "")})
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <Tag>{STYLES[s.style]}</Tag>
                  {s.rice.map((r) => (
                    <Tag key={r}>{RICE_CAKES[r]}</Tag>
                  ))}
                  <span className={`text-[12px] ${stale ? "text-spicytext" : "text-ink3"}`}>
                    확인 {confirmedAgo(s.lastConfirmedAt, now)}
                  </span>
                </div>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
