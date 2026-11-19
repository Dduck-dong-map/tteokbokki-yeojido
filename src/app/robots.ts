import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// 운영 어드민(/admin) · API · 등록 화면은 검색엔진을 막는다
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/register", "/admin"] }, sitemap: `${SITE}/sitemap.xml` };
}
