import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import StoreList, { visibleStores } from "@/components/StoreList";
import { BottomNav, SampleRibbon } from "@/components/ui";
import { USING_SAMPLE_DATA, getRegions, getStores } from "@/lib/data";

export const metadata: Metadata = { title: "동네별 떡볶이 목록" };

// 아래 메뉴 「목록」: 동네 고르기 + 최근 확인된 가게
export default function ListPage() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-[480px] flex-col bg-paper">
      <Suspense fallback={<div className="flex-1" />}>
        <Loader />
      </Suspense>
      <div className="sticky bottom-0">
        <BottomNav active="list" />
      </div>
    </div>
  );
}

async function Loader() {
  await connection();
  const now = new Date();
  const stores = visibleStores(await getStores(), now);
  const regions = getRegions();

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-line bg-bar px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-3">
        <h1 className="text-[18px] font-bold">목록</h1>
        <div className="mt-2 flex gap-2">
          {regions.map((r) => (
            <Link key={r.gu} href={`/seoul/${r.gu}`} className="h-8 rounded-full border border-chipline bg-surface px-3 text-[13px] leading-8 text-ink2">
              {r.name} {stores.filter((s) => s.gu === r.gu).length}곳
            </Link>
          ))}
        </div>
      </header>
      {USING_SAMPLE_DATA && (
        <div className="flex justify-center pt-3">
          <SampleRibbon />
        </div>
      )}
      <h2 className="px-4 pt-4 text-[13px] font-semibold text-ink3">최근 확인된 가게부터</h2>
      <main className="flex-1">
        <StoreList stores={stores} now={now} />
      </main>
    </>
  );
}
