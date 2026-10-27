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
  shopType: ShopType;
  usage: Usage[];
  price: number; // 대표 떡볶이 1인분, 원
  priceCheckedAt: string; // YYYY-MM-DD
  menu: MenuItem[];
  hours: Hours;
  lastConfirmedAt: string; // YYYY-MM-DD, '아직 있어요'·제보 승인 때 새로 고침
  isSample?: boolean; // 예시 데이터 (실제 가게 아님)
};

export type Region = { gu: string; name: string; city: "seoul" };
