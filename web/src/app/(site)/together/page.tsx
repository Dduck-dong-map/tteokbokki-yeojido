import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import TogetherPage from "@/components/together/TogetherPage";
import { BottomNav } from "@/components/ui";
import { USING_SAMPLE_DATA, getStores } from "@/lib/data";

export const metadata: Metadata = { title: "함께 고치기", robots: { index: false } };

// 아래 메뉴 「함께 고치기」: 새로 온 가게 확인 + 오래된 정보 갱신. 지도가 살아 있게 하는 칸이다.
export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="page-wide">
          <div className="flex-1" />
          <BottomNav active="together" />
        </div>
      }
    >
      <Loader />
    </Suspense>
  );
}

async function Loader() {
  await connection();
  return <TogetherPage stores={await getStores()} sample={USING_SAMPLE_DATA} nowIso={new Date().toISOString()} />;
}
