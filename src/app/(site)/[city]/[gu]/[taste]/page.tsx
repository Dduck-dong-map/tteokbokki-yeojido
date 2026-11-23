import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getRegion, getRegions, getStores } from "@/lib/data";
import { Suspense } from "react";
import { ListSkeleton, RegionList, findTaste, tastes } from "../regionPage";

// 가게가 한 곳이라도 있는 지역 × 취향 조합만 미리 만든다 → 가게가 늘면 페이지도 늘어난다
export async function generateStaticParams() {
  const stores = await getStores();
  const params = getRegions().flatMap((r) =>
    tastes()
      .filter((t) => stores.some((s) => s.gu === r.gu && t.match(s)))
      .map((t) => ({ city: r.city, gu: r.gu, taste: t.slug })),
  );
  // Cache Components 는 빈 목록을 받지 않는다 (예시를 숨기고 빌드하면 빌드 때 가게 0곳) → 자리 하나. 페이지는 요청 때 다시 읽는다
  return params.length ? params : [{ city: getRegions()[0].city, gu: getRegions()[0].gu, taste: tastes()[0].slug }];
}

export async function generateMetadata({ params }: PageProps<"/[city]/[gu]/[taste]">): Promise<Metadata> {
  "use cache";
  const { city, gu, taste } = await params;
  const r = getRegion(gu, city);
  const t = findTaste(taste);
  return r && t ? { title: `${r.name} ${t.label} 맛집`, description: `${r.name} ${t.label} 가게 목록. 맵기·가격·마지막 확인일까지 한눈에.` } : {};
}

export default function TastePage({ params }: PageProps<"/[city]/[gu]/[taste]">) {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <TasteLoader params={params} />
    </Suspense>
  );
}

async function TasteLoader({ params }: Pick<PageProps<"/[city]/[gu]/[taste]">, "params">) {
  await connection();
  const { city, gu, taste } = await params;
  return <TasteList city={city} gu={gu} taste={taste} />;
}

async function TasteList({ city, gu, taste }: { city: string; gu: string; taste: string }) {
  const region = getRegion(gu, city);
  const t = findTaste(taste);
  if (!region || !t) notFound();
  return <RegionList region={region} stores={await getStores()} taste={t} now={new Date()} />;
}
