import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import MinePage, { type MineTab } from "@/components/mine/MinePage";
import { USING_SAMPLE_DATA, getPublicLists, getStores } from "@/lib/data";

export const metadata: Metadata = { title: "내 맛지도" };

const TABS: MineTab[] = ["my", "all", "saved", "reports"];

// 메뉴 「내 맛지도」(11-08): 맛집 리스트 만들기 · 모두의 리스트(추천) · 찜한 가게 · 내 등록.
// 리스트는 서버에 저장되어 링크로 나눌 수 있고, 찜·내 등록은 이 기기에만 있다.
export default function Page({ searchParams }: PageProps<"/mine">) {
  return (
    <Suspense fallback={<div className="page-wide" />}>
      <Loader searchParams={searchParams} />
    </Suspense>
  );
}

async function Loader({ searchParams }: Pick<PageProps<"/mine">, "searchParams">) {
  await connection();
  const q = (await searchParams).tab;
  const tab = TABS.find((t) => t === q) ?? "my";
  const [stores, lists] = await Promise.all([getStores(), getPublicLists()]);
  return <MinePage stores={stores} lists={lists} sample={USING_SAMPLE_DATA} nowIso={new Date().toISOString()} initialTab={tab} />;
}
