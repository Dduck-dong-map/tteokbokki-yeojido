import type { MetadataRoute } from "next";
import { USING_SAMPLE_DATA } from "@/lib/data";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// 예시 데이터일 때는 검색엔진을 막고, 실제 데이터가 들어오면 연다. 운영 어드민(/admin)은 늘 막는다
export default function robots(): MetadataRoute.Robots {
  return USING_SAMPLE_DATA
    ? { rules: { userAgent: "*", disallow: "/" } }
    : { rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/report", "/admin"] }, sitemap: `${SITE}/sitemap.xml` };
}
