import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import { notFound } from "next/navigation";
import { getRegion, getRegions, getStores } from "@/lib/data";
import { Suspense } from "react";
import { ListSkeleton, RegionList, findTaste, tastes } from "../regionPage";

// 가게가 한 곳이라도 있는 지역 × 취향 조합만 미리 만든다 → 가게가 늘면 페이지도 늘어난다
export async function generateStaticParams() {
  const stores = await getStores();
  return getRegions().flatMap((r) =>
    tastes()
      .filter((t) => stores.some((s) => s.gu === r.gu && t.match(s)))
      .map((t) => ({ gu: r.gu, taste: t.slug })),
  );
}

export async function generateMetadata({ params }: PageProps<"/seoul/[gu]/[taste]">): Promise<Metadata> {
  "use cache";
  const { gu, taste } = await params;
  const r = getRegion(gu);
  const t = findTaste(taste);
  return r && t ? { title: `${r.name} ${t.label} 맛집`, description: `${r.name} ${t.label} 가게 목록. 맵기·가격·마지막 확인일까지 한눈에.` } : {};
}

export default function TastePage({ params }: PageProps<"/seoul/[gu]/[taste]">) {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <TasteLoader params={params} />
    </Suspense>
  );
}

async function TasteLoader({ params }: Pick<PageProps<"/seoul/[gu]/[taste]">, "params">) {
  const { gu, taste } = await params;
  return <TasteList gu={gu} taste={taste} />;
}

async function TasteList({ gu, taste }: { gu: string; taste: string }) {
  "use cache";
  cacheLife("hours");

  const region = getRegion(gu);
  const t = findTaste(taste);
  if (!region || !t) notFound();
  return <RegionList region={region} stores={await getStores()} taste={t} now={new Date()} />;
}
