import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import ListView from "@/components/lists/ListView";
import { BackHeader } from "@/components/ui";
import { getList, getStores } from "@/lib/data";

export async function generateMetadata({ params }: PageProps<"/lists/[id]">): Promise<Metadata> {
  "use cache";
  const l = await getList((await params).id);
  if (!l) return {};
  return {
    title: `${l.title} · 맛집 리스트`,
    description: l.desc ?? `${l.who} 님이 고른 떡볶이 가게 ${l.storeIds.length}곳`,
    robots: l.visibility === "link" ? { index: false } : undefined,
  };
}

// 맛집 리스트 하나 (내 맛지도, 11-08): 이름 · 설명 · 추천 · 공유 → 지도 + 가게 순서대로.
// 링크로만 공유한 리스트도 주소를 아는 사람은 볼 수 있다. 고치기는 만든 기기에서만.
export default function ListPage({ params }: PageProps<"/lists/[id]">) {
  return (
    <div className="page-wide">
      <BackHeader title="맛집 리스트" href="/mine" />
      <Suspense fallback={<div className="flex-1" />}>
        <Loader params={params} />
      </Suspense>
    </div>
  );
}

async function Loader({ params }: Pick<PageProps<"/lists/[id]">, "params">) {
  await connection(); // 가게를 넣고 빼면 바로 보여야 한다
  const [list, all] = await Promise.all([getList((await params).id), getStores()]);
  if (!list) notFound();
  const byId = new Map(all.map((s) => [s.id, s]));
  const stores = list.storeIds.map((id) => byId.get(id)).filter((s) => !!s);
  const pick = all.map(({ id, name, dong }) => ({ id, name, dong }));
  return <ListView list={list} stores={stores} pick={pick} nowIso={new Date().toISOString()} />;
}
