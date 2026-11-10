import { connection } from "next/server";
import { Suspense } from "react";
import MapShell from "@/components/home/MapShell";
import TigerLoader from "@/components/loading/TigerLoader";
import { USING_SAMPLE_DATA, getRecentReportCount, getStores } from "@/lib/data";

// 지도 홈(/)과 가게 상세(/store/[id])가 함께 쓰는 틀.
// PC에서는 상세를 열어도 큰 지도가 끊기지 않고 옆에 남아 있어야 해서, 지도를 레이아웃에 둔다.
export default function MapLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="relative h-dvh bg-background md:h-[calc(100dvh-56px)]">
          <TigerLoader />
        </div>
      }
    >
      <Loader>{children}</Loader>
    </Suspense>
  );
}

async function Loader({ children }: { children: React.ReactNode }) {
  await connection(); // 새 등록이 바로 보이도록 요청 때마다 새로 읽는다
  const [stores, recentReports] = await Promise.all([getStores(), getRecentReportCount()]);
  // 지도·목록에 안 쓰는 긴 글은 빼고 보낸다 (가게가 늘어도 페이지가 무거워지지 않게)
  const light = stores.map((s) => ({ ...s, memo: undefined, introBy: undefined, introAt: undefined, spiceVotes: undefined }));
  return (
    <MapShell stores={light} recentReports={recentReports} sample={USING_SAMPLE_DATA}>
      {children}
    </MapShell>
  );
}
