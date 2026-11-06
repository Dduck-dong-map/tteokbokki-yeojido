import type { Grade, RiceCake, ShopType, Side, Spice, Style, Taste, Usage } from "./taxonomy";

export type MenuItem = { name: string; price: number };

// 요일 0 = 일요일. open/close 는 "HH:MM", 자정을 넘기면 close 가 open 보다 작다.
export type Hours = { days: number[]; open: string; close: string };

export type Store = {
  id: string; // 주소에 쓰는 짧은 이름 (/store/[id])
  name: string;
  grade: Grade;
  lat: number;
  lng: number;
  address: string;
  gu: string; // 구 주소 이름 (mapo, seodaemun …)
  dong: string;
  rice: RiceCake[];
  style: Style;
  spice: Spice; // 맵기 투표 평균을 반올림한 값
  spiceLabel?: string; // 가게가 부르는 단계 이름 (예: 초보맛)
  taste: Taste[];
  sides: Side[];
  shopType?: ShopType; // 제보로 들어온 가게는 비어 있을 수 있다
  usage: Usage[];
  price: number; // 대표 떡볶이 1인분, 원
  priceCheckedAt: string; // YYYY-MM-DD
  menu: MenuItem[];
  hours?: Hours; // 제보할 때 몰라도 된다. 나중에 누구나 채운다
  lastConfirmedAt: string; // YYYY-MM-DD, '아직 있어요'·정보 수정 때 새로 고침
  // 가게 평점(별 1~5, 식당 자체). 맛은 맵기(고추)로 따로 본다 — 두 축.
  // 기획안 v4 「별점 없음」은 슬랙 10-28 팀 결정으로 뒤집혔다(irisonestar 제안, ✅).
  rating?: { avg: number; count: number };
  isSample?: boolean; // 예시 데이터 (실제 가게 아님)

  // 모두가 고치는 지도 (거지맵 구도, 11-04)
  status?: StoreStatus; // 없으면 active
  createdAt?: string; // YYYY-MM-DD. 있으면 제보로 들어온 가게 → 일주일 동안 「확인 중」
  by?: string; // 처음 제보한 사람의 닉네임
  verify?: { yes: number; no: number }; // 「맞아요」「달라요」 수
  spiceVotes?: { sum: number; count: number }; // spice 는 이 값의 평균을 반올림한 것
  photos?: string[]; // 사진 id (/api/photos/[id])
  memo?: string;
};

export type StoreStatus = "active" | "hidden" | "closed";

export type Region = { gu: string; name: string; city: "seoul" };

// 한 줄 후기 · 평가 (화면에 보여도 되는 값만)
export type Review = { id: string; at: string; who: string; stars?: number; spice?: number; text?: string };

// 변경 이력 한 줄
export type HistoryKind = "new" | "edit" | "still" | "hidden" | "closed" | "verified";
export type Change = { field: string; from: string; to: string };
export type HistoryItem = { id: string; at: string; who: string; kind: HistoryKind; changes?: Change[] };
