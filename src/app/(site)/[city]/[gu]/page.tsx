import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getRegion, getRegions, getStores } from "@/lib/data";
import { Suspense } from "react";
import { ListSkeleton, RegionList } from "./regionPage";

export function generateStaticParams() {
  return getRegions().map((r) => ({ city: r.city, gu: r.gu }));
}

export async function generateMetadata({ params }: PageProps<"/[city]/[gu]">): Promise<Metadata> {
  "use cache";
  const { city, gu } = await params;
  const r = getRegion(gu, city);
  return r ? { title: `${r.name} 떡볶이 맛집 지도`, description: `${r.name} 떡볶이 가게를 떡 종류·스타일·맵기로 골라 보세요.` } : {};
}

export default function GuPage({ params }: PageProps<"/[city]/[gu]">) {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <GuLoader params={params} />
    </Suspense>
  );
}

async function GuLoader({ params }: Pick<PageProps<"/[city]/[gu]">, "params">) {
  await connection();
  const { city, gu } = await params;
  return <GuList city={city} gu={gu} />;
}

async function GuList({ city, gu }: { city: string; gu: string }) {
  const region = getRegion(gu, city);
  if (!region) notFound();
  return <RegionList region={region} stores={await getStores()} now={new Date()} />;
}
