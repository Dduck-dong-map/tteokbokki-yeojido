import type { MetadataRoute } from "next";
import { getRegions, getStores } from "@/lib/data";
import { tastes } from "./seoul/[gu]/regionPage";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// 지역·취향 목록과 가게 상세를 검색엔진에 알린다
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const stores = await getStores();
  const regions = getRegions();
  return [
    { url: SITE, priority: 1 },
    { url: `${SITE}/list` },
    ...regions.map((r) => ({ url: `${SITE}/seoul/${r.gu}`, priority: 0.8 })),
    ...regions.flatMap((r) =>
      tastes()
        .filter((t) => stores.some((s) => s.gu === r.gu && t.match(s)))
        .map((t) => ({ url: `${SITE}/seoul/${r.gu}/${t.slug}`, priority: 0.7 })),
    ),
    ...stores.map((s) => ({ url: `${SITE}/store/${s.id}`, lastModified: s.lastConfirmedAt, priority: 0.6 })),
  ];
}
