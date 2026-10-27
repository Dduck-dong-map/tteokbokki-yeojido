import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import { notFound } from "next/navigation";
import { getRegion, getRegions, getStores } from "@/lib/data";
import { Suspense } from "react";
import { ListSkeleton, RegionList } from "./regionPage";

export function generateStaticParams() {
  return getRegions().map((r) => ({ gu: r.gu }));
}

export async function generateMetadata({ params }: PageProps<"/seoul/[gu]">): Promise<Metadata> {
  "use cache";
  const r = getRegion((await params).gu);
  return r ? { title: `${r.name} 떡볶이 맛집 지도`, description: `${r.name} 떡볶이 가게를 떡 종류·스타일·맵기로 골라 보세요.` } : {};
}

export default function GuPage({ params }: PageProps<"/seoul/[gu]">) {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <GuLoader params={params} />
    </Suspense>
  );
}

async function GuLoader({ params }: Pick<PageProps<"/seoul/[gu]">, "params">) {
  return <GuList gu={(await params).gu} />;
}

async function GuList({ gu }: { gu: string }) {
  "use cache";
  cacheLife("hours");

  const region = getRegion(gu);
  if (!region) notFound();
  return <RegionList region={region} stores={await getStores()} now={new Date()} />;
}
