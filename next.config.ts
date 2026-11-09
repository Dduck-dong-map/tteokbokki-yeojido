import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 공식 권장 기본값: 데이터는 기본이 동적이고, 캐시는 필요한 곳에만 "use cache"로 둔다.
  // 문서대로 partialPrefetching을 함께 켠다(cacheComponents 없이 켜면 오류).
  cacheComponents: true,
  partialPrefetching: true,
  // 개발 전용: 개발 서버는 localhost 만 허용한다. 127.0.0.1 로 열면 React 가 안 붙어 지도가 안 뜨므로 허용 목록에 넣는다.
  allowedDevOrigins: ["127.0.0.1"],
  // 공유 허브(public/share/, scripts/copy-share.mjs): Next 는 폴더 주소에 index.html 을 붙여 주지 않아서 넘겨 준다
  async redirects() {
    return [
      // 옛 주소: 「제보」가 「등록」으로 바뀌었다 (웹 1차 기획 REQ-W12)
      { source: "/report", destination: "/register", permanent: false },
      // 「함께 고치기」 메뉴는 없앴다(11-08). 고치기는 가게 상세 안에서 한다.
      { source: "/together", destination: "/", permanent: false },
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
