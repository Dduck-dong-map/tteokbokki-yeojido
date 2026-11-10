import Link from "next/link";
import type { ReactNode } from "react";
import StoreList, { visibleStores } from "@/components/StoreList";
import { SampleRibbon } from "@/components/brand";
import { BackHeader, GRID_LI, GRID_UL } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { USING_SAMPLE_DATA } from "@/lib/data";
import { RICE_CAKES, STYLES, keysOf, type RiceCake, type Style } from "@/lib/taxonomy";
import type { Region, Store } from "@/lib/types";
import { cn } from "@/lib/utils";

// 지역·취향 목록 페이지 (검색 유입용, 기획안 5·11절)
// /seoul/mapo · /seoul/mapo/soup(스타일) · /seoul/mapo/rice(떡)
export type Taste = { slug: string; label: string; match: (s: Store) => boolean };

export function tastes(): Taste[] {
  return [
    ...keysOf(STYLES).map((k: Style) => ({ slug: k, label: `${STYLES[k]}떡볶이`, match: (s: Store) => s.style === k })),
    ...keysOf(RICE_CAKES).map((k: RiceCake) => ({
      slug: k,
      label: k === "bunmoja" ? "분모자떡볶이" : `${RICE_CAKES[k]}볶이`, // 쌀떡 → 쌀떡볶이
      match: (s: Store) => s.rice.includes(k),
    })),
  ];
}

export const findTaste = (slug: string) => tastes().find((t) => t.slug === slug);

// 취향 칩 하나. 활성 = 주 버튼색(bg-primary), 비활성 = 테두리 칩. 현재 것은 aria-current 로 알린다.
// 폰 누르는 곳은 .hit 으로 44px — Badge 의 overflow-hidden 이 .hit 의 ::after 를 자르지 않게 푼다.
function TasteChip({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <Badge
      variant={active ? "default" : "outline"}
      render={<Link href={href} aria-current={active ? "page" : undefined} />}
      className={cn(
        "hit h-8 shrink-0 overflow-visible rounded-full px-3 text-[13px] font-medium",
        active ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card text-muted-foreground",
      )}
    >
      {children}
    </Badge>
  );
}

export function RegionList({ region, stores, taste, now }: { region: Region; stores: Store[]; taste?: Taste; now: Date }) {
  const inGu = visibleStores(stores, now).filter((s) => s.gu === region.gu);
  const shown = taste ? inGu.filter(taste.match) : inGu;
  const links = tastes().filter((t) => inGu.some(t.match));

  return (
    <div className="page-wide pb-10">
      <BackHeader title={`${region.name} ${taste ? taste.label : "떡볶이"} 지도`} href={taste ? `/seoul/${region.gu}` : "/list"} />
      {USING_SAMPLE_DATA && (
        <div className="flex justify-center pt-3">
          <SampleRibbon />
        </div>
      )}
      <p className="px-4 pt-4 text-[14px] text-muted-foreground md:px-0 md:pt-0">
        {region.name}의 {taste ? taste.label : "떡볶이"} 가게 {shown.length}곳 · 최근 확인된 곳부터 보여요.
      </p>
      {/* 취향 칩: 폰은 가로 스크롤(스크롤바 숨김), 768 이상은 줄바꿈 */}
      <nav aria-label="취향" className="flex gap-1.5 overflow-x-auto px-4 py-3 [scrollbar-width:none] md:flex-wrap md:overflow-visible md:px-0">
        <TasteChip href={`/seoul/${region.gu}`} active={!taste}>
          전체
        </TasteChip>
        {links.map((t) => (
          <TasteChip key={t.slug} href={`/seoul/${region.gu}/${t.slug}`} active={taste?.slug === t.slug}>
            {t.label}
          </TasteChip>
        ))}
      </nav>
      <StoreList stores={shown} now={now} />
    </div>
  );
}

// 불러오는 동안: 머리칸 + 안내 문구·칩·카드 자리를 회색 줄로 비워 둔다
export function ListSkeleton() {
  return (
    <div className="page-wide pb-10" aria-busy="true">
      <BackHeader title="" href="/list" />
      <div className="px-4 pt-4 md:px-0 md:pt-0">
        <Skeleton className="h-5 w-2/3 max-w-[320px]" />
      </div>
      <div className="flex gap-1.5 px-4 py-3 md:px-0">
        <Skeleton className="h-8 w-14 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>
      <ul className={cn(GRID_UL)}>
        {[0, 1, 2].map((i) => (
          <li key={i} className={cn(GRID_LI, "px-4 py-3.5")}>
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="mt-2 h-3 w-1/3" />
            <Skeleton className="mt-3 h-6 w-2/3 rounded-full" />
          </li>
        ))}
      </ul>
    </div>
  );
}
