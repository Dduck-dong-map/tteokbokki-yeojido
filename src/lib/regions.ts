import type { Region } from "./types";

// 지역 페이지(/seoul/[gu])와 어드민의 구 이름에 쓰는 구 목록
export const REGIONS: Region[] = [
  { city: "seoul", gu: "mapo", name: "마포구" },
  { city: "seoul", gu: "seodaemun", name: "서대문구" },
  // 11-15: 실제 가게 첫 지역 (docs/리서치/가게리서치_강남_v1_2026-11-15.md · lib/data/datasets.ts)
  { city: "seoul", gu: "gangnam", name: "강남구" },
];
