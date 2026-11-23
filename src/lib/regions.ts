import type { Region } from "./types";

// 지역 페이지(/[city]/[gu] — /seoul/mapo · /seongnam/bundang)와 어드민의 구 이름에 쓰는 구 목록
export const REGIONS: Region[] = [
  { city: "seoul", gu: "mapo", name: "마포구" },
  { city: "seoul", gu: "seodaemun", name: "서대문구" },
  // 11-15: 실제 가게 첫 지역 (docs/리서치/가게리서치_강남_v1_2026-11-15.md · lib/data/datasets.ts)
  { city: "seoul", gu: "gangnam", name: "강남구" },
  // 11-23: 운영에 처음 들어온 가게가 성남이라 더했다. 이름은 「성남 분당구」처럼 도시를 붙여 서울의 구와 가른다
  { city: "seongnam", gu: "bundang", name: "성남 분당구" },
  { city: "seongnam", gu: "jungwon", name: "성남 중원구" },
  { city: "seongnam", gu: "sujeong", name: "성남 수정구" },
];
