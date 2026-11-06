import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // 공유 허브(public/share/, scripts/copy-share.mjs): Next 는 폴더 주소에 index.html 을 붙여 주지 않아서 넘겨 준다
  async redirects() {
    return [
      // 옛 주소: 「제보」가 「등록」으로 바뀌었다 (웹 1차 기획 REQ-W12)
      { source: "/report", destination: "/register", permanent: false },
      { source: "/share", destination: "/share/index.html", permanent: false },
      { source: "/share/board", destination: "/share/board/index.html", permanent: false },
      { source: "/share/roadmap", destination: "/share/roadmap/index.html", permanent: false },
    ];
  },
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
