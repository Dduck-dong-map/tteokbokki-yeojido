import type { MetadataRoute } from "next";

// 홈 화면에 추가하면 앱처럼 열린다 (PWA, 기획안 9절)
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "떡볶여지도",
    short_name: "떡볶여지도",
    description: "떡 종류와 맵기까지 골라 찾는 분식 맛집 지도",
    start_url: "/",
    display: "standalone",
    // 앱 바탕(tokens.css --background-primary)과 같게. layout.tsx themeColor 도 같은 값 (11-13 수정판: 셋이 서로 달랐다)
    // 웹 바탕을 T2 흰색으로 정하면 셋 다 #FFFFFF 로 바꾼다
    background_color: "#F3F1EE",
    theme_color: "#F3F1EE",
    lang: "ko",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
