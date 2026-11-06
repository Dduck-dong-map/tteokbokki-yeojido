import Link from "next/link";
import StoreList, { visibleStores } from "@/components/StoreList";
import { BackHeader, SampleRibbon } from "@/components/ui";
import { USING_SAMPLE_DATA } from "@/lib/data";
import { RICE_CAKES, STYLES, keysOf, type RiceCake, type Style } from "@/lib/taxonomy";
import type { Region, Store } from "@/lib/types";

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
      <p className="px-4 pt-4 text-[14px] text-ink2 md:px-0 md:pt-0">
        {region.name}의 {taste ? taste.label : "떡볶이"} 가게 {shown.length}곳 · 최근 확인된 곳부터 보여요.
      </p>
      <nav className="flex gap-1.5 overflow-x-auto px-4 py-3 [scrollbar-width:none] md:flex-wrap md:overflow-visible md:px-0">
        <Link href={`/seoul/${region.gu}`} className={`h-8 shrink-0 rounded-full border px-3 text-[13px] leading-8 ${!taste ? "border-primary bg-primary text-onprimary" : "border-chipline bg-surface text-ink2"}`}>
          전체
        </Link>
        {links.map((t) => (
          <Link
            key={t.slug}
            href={`/seoul/${region.gu}/${t.slug}`}
            className={`h-8 shrink-0 rounded-full border px-3 text-[13px] leading-8 ${taste?.slug === t.slug ? "border-primary bg-primary text-onprimary" : "border-chipline bg-surface text-ink2"}`}
          >
            {t.label}
          </Link>
        ))}
      </nav>
      <StoreList stores={shown} now={now} />
    </div>
  );
}

export function ListSkeleton() {
  return (
    <div className="page-wide">
      <BackHeader title="" href="/list" />
    </div>
  );
}
