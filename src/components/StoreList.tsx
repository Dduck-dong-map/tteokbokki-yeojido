import Link from "next/link";
import { StoreCardBody } from "@/components/home/StoreCardBody";
import { GRID_LI, GRID_UL } from "@/components/layout";
import { byRecentlyConfirmed } from "@/lib/filters";
import { freshness } from "@/lib/freshness";
import type { Store } from "@/lib/types";
import { cn } from "@/lib/utils";

// 목록: 지도 없이도 읽히는 글 목록 (검색엔진·지도 API 한도 대비, 기획안 13절)
// 365일 넘은 가게는 내리고, 최근 확인된 가게를 위에 둔다.
export function visibleStores(stores: Store[], now: Date) {
  return stores.filter((s) => freshness(s, now) !== "expired").sort(byRecentlyConfirmed);
}

// 카드 본문은 지도 홈 목록 줄(StoreRowView)과 같은 StoreCardBody 를 쓴다(리팩토링 계획 7-2).
// 여기서는 바깥 껍데기(격자 · 상세로 가는 Link)만 그린다. 글 목록이라 사진은 끄고 종류 배지는 켠다.
export default function StoreList({ stores, now }: { stores: Store[]; now: Date }) {
  if (!stores.length) {
    return <p className="px-4 py-10 text-center text-[14px] text-muted-foreground/70">아직 등록된 가게가 없어요. 아는 집을 등록해 주세요!</p>;
  }
  return (
    <ul className={cn(GRID_UL)}>
      {stores.map((s) => (
        <li key={s.id} className={cn(GRID_LI)}>
          <Link
            href={`/store/${s.id}`}
            className={cn(
              "flex h-full min-h-11 gap-3 px-4 py-3.5 outline-none",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset md:rounded-2xl md:hover:bg-muted",
            )}
          >
            <StoreCardBody store={s} now={now} tags />
          </Link>
        </li>
      ))}
    </ul>
  );
}
