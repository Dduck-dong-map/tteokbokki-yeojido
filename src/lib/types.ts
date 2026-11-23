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
  spice: Spice; // 대표 메뉴 맵기. 등록 때 고르고 누구나 고친다 (투표는 메뉴별 구조와 함께 나중에, 웹 1차 기획 부록 A)
  spiceLabel?: string; // 가게가 부르는 단계 이름 (예: 초보맛)
  taste: Taste[];
  sides: Side[];
  shopType?: ShopType; // 이용자가 등록한 가게는 비어 있을 수 있다
  usage: Usage[];
  price: number; // 대표 떡볶이 1인분, 원
  priceCheckedAt: string; // YYYY-MM-DD
  menu: MenuItem[];
  hours?: Hours; // 등록할 때 몰라도 된다. 나중에 누구나 채운다
  lastConfirmedAt: string; // YYYY-MM-DD, '아직 있어요'·정보 수정 때 새로 고침
  // 가게 평점(별 1~5, 식당 자체). 맛은 맵기(고추)로 따로 본다 — 두 축.
  // 기획안 v4 「별점 없음」은 슬랙 10-28 팀 결정으로 뒤집혔다(irisonestar 제안, ✅).
  rating?: { avg: number; count: number };

  // 모두가 고치는 지도 (거지맵 구도, 11-04)
  status?: StoreStatus; // 없으면 active
  createdAt?: string; // YYYY-MM-DD. 있으면 이용자가 등록한 가게 → 일주일 동안 「확인 중」
  by?: string; // 처음 등록한 사람의 닉네임
  verify?: { yes: number; no: number }; // 「맞아요」「달라요」 수
  photos?: string[]; // 사진 id (/api/photos/[id])
  memo?: string; // 화면 이름은 「소개글」. 가게당 한 편, 누구나 고치고 이력에 남는다
  introBy?: string; // 소개글을 처음 쓴 사람
  introAt?: string; // 소개글을 마지막으로 고친 날 YYYY-MM-DD
};

// 쓰기 요청이 거절될 때의 모양. lib/data/db.ts 가 만들고 app/api/* 가 그대로 응답으로 돌려준다 (request.ts 의 reply)
export type Fail = { ok: false; error: string; existing?: string; status: number };

export type StoreStatus = "active" | "hidden" | "closed";

// city = 주소 첫 칸(/seoul/mapo · /seongnam/bundang). 구 이름표(gu)는 도시가 달라도 겹치지 않게 짓는다
export type Region = { gu: string; name: string; city: "seoul" | "seongnam" };

// 한 줄 후기 · 평가 (화면에 보여도 되는 값만)
// spice 는 예전 맵기 투표 값이라 새 평가에는 없다
export type Review = { id: string; at: string; who: string; stars?: number; text?: string };

// 변경 이력 한 줄
export type HistoryKind = "new" | "edit" | "still" | "hidden" | "closed" | "verified";
export type Change = { field: string; from: string; to: string };
export type HistoryItem = { id: string; at: string; who: string; kind: HistoryKind; changes?: Change[] };
