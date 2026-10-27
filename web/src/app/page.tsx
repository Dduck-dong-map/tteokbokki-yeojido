import { Suspense } from "react";
import MapHome from "@/components/home/MapHome";
import { USING_SAMPLE_DATA, getRecentReportCount, getStores } from "@/lib/data";

// 지도 홈: 가입 없이 바로 지도 (기획안 5·6절)
export default async function Home() {
  const [stores, recentReports] = await Promise.all([getStores(), getRecentReportCount()]);
  return (
    <Suspense fallback={<div className="h-dvh bg-paper" />}>
      <MapHome stores={stores} recentReports={recentReports} sample={USING_SAMPLE_DATA} />
    </Suspense>
  );
}
