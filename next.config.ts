import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 공식 권장 기본값: 데이터는 기본이 동적이고, 캐시는 필요한 곳에만 "use cache"로 둔다.
  // 문서대로 partialPrefetching을 함께 켠다(cacheComponents 없이 켜면 오류).
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
