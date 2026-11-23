import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import StoreList, { visibleStores } from "@/components/StoreList";
import { BottomNav } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { getRegions, getStores } from "@/lib/data";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "동네별 떡볶이 목록" };

// 동네 고르기 + 최근 확인된 가게. 11-08 부터 메뉴에서는 빠졌고, 동네 목록의 「뒤로」와 검색 유입으로 들어온다.
export default function ListPage() {
  return (
    <div className="page-wide">
      <Suspense fallback={<div className="flex-1" />}>
        <Loader />
      </Suspense>
      <div className="sticky bottom-0 md:hidden">
        <BottomNav />
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
      {/* 폰에서는 위에 붙어 따라오는 머리칸, 768 이상은 제목 줄(BackHeader 와 같은 규칙) */}
      <header
        className={cn(
          "z-10 border-b border-border bg-background px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-3",
          "max-md:sticky max-md:top-0 md:border-0 md:bg-transparent md:px-0 md:pt-5",
        )}
      >
        <h1 className="text-heading-4 text-foreground">목록</h1>
        {/* 동네 칩: 누르면 지역 페이지. 폰 누르는 곳은 .hit 으로 44px (REQ-W10) — Badge 의 overflow-hidden 이 .hit 의 ::after 를 자르지 않게 푼다 */}
        <nav aria-label="동네" className="mt-2 flex flex-wrap gap-2">
          {regions.map((r) => (
            <Badge
              key={r.gu}
              variant="outline"
              render={<Link href={`/${r.city}/${r.gu}`} />}
              className="hit h-8 overflow-visible rounded-full border-input bg-card px-3 text-caption font-medium text-muted-foreground"
            >
              {r.name} {stores.filter((s) => s.gu === r.gu).length}곳
            </Badge>
          ))}
        </nav>
      </header>

      <h2 className="px-4 pt-4 font-sans text-caption font-semibold text-muted-foreground/70 md:px-0 md:pt-1 md:pb-3">최근 확인된 가게부터</h2>
      <main className="flex-1">
        <StoreList stores={stores} now={now} />
      </main>
    </>
  );
}
