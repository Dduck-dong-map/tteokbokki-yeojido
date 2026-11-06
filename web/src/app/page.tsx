import { connection } from "next/server";
import { Suspense } from "react";
import MapHome from "@/components/home/MapHome";
import { USING_SAMPLE_DATA, getRecentReportCount, getStores } from "@/lib/data";

// 지도 홈: 가입 없이 바로 지도 (기획안 5·6절). 제보가 바로 보이도록 요청 때마다 새로 읽는다.
export default function Home() {
  return (
    <Suspense fallback={<div className="h-dvh bg-paper" />}>
      <Loader />
    </Suspense>
  );
}

async function Loader() {
  await connection();
  const [stores, recentReports] = await Promise.all([getStores(), getRecentReportCount()]);
  return <MapHome stores={stores} recentReports={recentReports} sample={USING_SAMPLE_DATA} />;
}
