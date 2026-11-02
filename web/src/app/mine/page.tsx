import type { Metadata } from "next";
import MinePage from "@/components/mine/MinePage";
import { USING_SAMPLE_DATA, getStores } from "@/lib/data";

export const metadata: Metadata = { title: "내 맛지도", robots: { index: false } };

// 아래 메뉴 「내 맛지도」: 저장한 가게 · 다녀옴 · 내 제보 (이 기기에만, 로그인 없음). 보드 N3-05 (11-02)
export default async function Page() {
  const stores = await getStores();
  return <MinePage stores={stores} sample={USING_SAMPLE_DATA} />;
}
