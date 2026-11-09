import type { MetadataRoute } from "next";

// 홈 화면에 추가하면 앱처럼 열린다 (PWA, 기획안 9절)
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "떡볶여지도",
    short_name: "떡볶여지도",
    description: "떡 종류와 맵기까지 골라 찾는 분식 맛집 지도",
    start_url: "/",
    display: "standalone",
    background_color: "#ECE3D1",
    theme_color: "#ECE3D1",
    lang: "ko",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
