import { daysSince } from "./freshness";
import { GRADES, RICE_CAKES, STYLES, USAGES, type Grade, type RiceCake, type Spice, type Style, type Usage } from "./taxonomy";
import type { Hours, MenuItem, Store } from "./types";

// 「모두가 고치는 지도」 규칙 (거지맵 구도를 추린 MVP, 11-04 · docs/MVP_거지맵구도_2026-11-04.md)
// 제보는 사전 승인 없이 바로 올라가고, 이용자들이 뒤에서 걸러 낸다.
// 화면과 서버가 같은 규칙으로 검사한다.

export const VERIFY_DAYS = 7; // 새 가게는 일주일 동안 「확인 중」으로 보인다
export const VERIFY_YES = 3; // 「맞아요」 3명이면 확인 완료
export const HIDE_AT = 3; // 「달라요」 또는 신고가 3명 쌓이면 지도에서 내린다
export const MIN_PHOTOS = 1; // 새 가게 제보에 필요한 사진 (간판이나 메뉴판) — 값만 바꾸면 2장으로 올릴 수 있다
export const MAX_PHOTOS = 5;
export const MAX_MENU = 5;
export const DAILY_LIMIT = 10; // 기기·접속 위치 기준 하루 제보·수정 10건
export const DUP_RADIUS_M = 80; // 이 거리 안에 같은 이름이 있으면 이미 있는 가게로 본다
export const OLD_DAYS = 60; // 마지막 확인이 이보다 오래되면 「확인이 필요해요」

export const FLAG_REASONS = {
  closed: "문을 닫았어요",
  notTteok: "떡볶이를 안 팔아요",
  ad: "광고 같아요",
  wrong: "엉뚱한 곳에 찍혀 있어요",
  bad: "부적절한 사진·글이 있어요",
} as const;
export type FlagReason = keyof typeof FLAG_REASONS;

export const STAR_WORDS = ["", "별로", "그저 그래요", "괜찮아요", "맛있어요", "최고예요"] as const;

export type NewStoreInput = {
  name: string;
  address: string;
  lat: number;
  lng: number;
  grade: Grade;
  rice: RiceCake[];
  style: Style;
  spice: Spice;
  stars?: number;
  menu: MenuItem[]; // 첫 줄 = 대표 메뉴. 대표 메뉴 가격이 지도에 나온다
  photos: string[];
};

// 정보 고치기: 맵기는 여기서 안 고친다(평가에서 투표). 사진은 더하기만 한다.
export type StorePatch = {
  name?: string;
  address?: string;
  lat?: number;
  lng?: number;
  grade?: Grade;
  rice?: RiceCake[];
  style?: Style;
  menu?: MenuItem[];
  hours?: Hours | null;
  usage?: Usage[];
  memo?: string;
  addPhotos?: string[];
};

const inKorea = (lat: number, lng: number) => lat > 33 && lat < 39 && lng > 124 && lng < 132;

function checkMenu(menu: MenuItem[] | undefined): string | null {
  if (!menu?.length || !menu[0].name?.trim()) return "대표 메뉴 이름을 넣어 주세요";
  if (menu.length > MAX_MENU) return `메뉴는 ${MAX_MENU}개까지 넣을 수 있어요`;
  for (const m of menu) {
    if (!m.name?.trim() || m.name.length > 30) return "메뉴 이름을 다시 봐 주세요";
    if (!Number.isInteger(m.price) || m.price < 500 || m.price > 100000) return `「${m.name.trim()}」 가격을 다시 봐 주세요`;
  }
  return null;
}

export function checkNewStore(r: Partial<NewStoreInput>): string | null {
  if (!r.name?.trim() || r.name.length > 60) return "가게 이름을 넣어 주세요";
  if (!r.address?.trim() || r.address.length > 120) return "주소를 넣어 주세요";
  if (typeof r.lat !== "number" || typeof r.lng !== "number" || !inKorea(r.lat, r.lng)) return "지도에서 가게 위치를 골라 주세요";
  if (!r.grade || !(r.grade in GRADES)) return "어떤 가게인지 골라 주세요";
  if (!r.rice?.length || r.rice.some((x) => !(x in RICE_CAKES))) return "떡을 하나 이상 골라 주세요";
  if (!r.style || !(r.style in STYLES)) return "스타일을 골라 주세요";
  if (!r.spice || !Number.isInteger(r.spice) || r.spice < 1 || r.spice > 5) return "맵기를 골라 주세요";
  if (r.stars !== undefined && (!Number.isInteger(r.stars) || r.stars < 1 || r.stars > 5)) return "별점을 다시 골라 주세요";
  const menuError = checkMenu(r.menu);
  if (menuError) return menuError;
  if ((r.photos?.length ?? 0) < MIN_PHOTOS) return `간판이나 메뉴판 사진을 ${MIN_PHOTOS}장 이상 올려 주세요`;
  if (r.photos!.length > MAX_PHOTOS) return `사진은 ${MAX_PHOTOS}장까지 올릴 수 있어요`;
  return null;
}

export function checkPatch(p: StorePatch): string | null {
  if (p.name !== undefined && (!p.name.trim() || p.name.length > 60)) return "가게 이름을 다시 봐 주세요";
  if (p.address !== undefined && (!p.address.trim() || p.address.length > 120)) return "주소를 다시 봐 주세요";
  if ((p.lat !== undefined || p.lng !== undefined) && !(typeof p.lat === "number" && typeof p.lng === "number" && inKorea(p.lat, p.lng))) return "지도에서 위치를 다시 골라 주세요";
  if (p.grade !== undefined && !(p.grade in GRADES)) return "어떤 가게인지 골라 주세요";
  if (p.rice !== undefined && (!p.rice.length || p.rice.some((x) => !(x in RICE_CAKES)))) return "떡을 하나 이상 골라 주세요";
  if (p.style !== undefined && !(p.style in STYLES)) return "스타일을 골라 주세요";
  if (p.menu !== undefined) {
    const e = checkMenu(p.menu);
    if (e) return e;
  }
  if (p.usage !== undefined && p.usage.some((x) => !(x in USAGES))) return "이용 정보를 다시 골라 주세요";
  if (p.memo !== undefined && p.memo.length > 200) return "메모는 200자까지예요";
  if (p.hours) {
    const time = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (!time.test(p.hours.open) || !time.test(p.hours.close)) return "영업시간을 다시 봐 주세요";
    if (!Array.isArray(p.hours.days) || !p.hours.days.length || p.hours.days.some((d) => !Number.isInteger(d) || d < 0 || d > 6)) return "여는 요일을 하나 이상 골라 주세요";
  }
  if (p.addPhotos !== undefined && p.addPhotos.length > MAX_PHOTOS) return `사진은 ${MAX_PHOTOS}장까지 올릴 수 있어요`;
  return null;
}

export function checkReview(r: { stars?: number; spice?: number; text?: string }): string | null {
  if (r.stars === undefined && r.spice === undefined) return "별점이나 맵기를 하나는 골라 주세요";
  if (r.stars !== undefined && (!Number.isInteger(r.stars) || r.stars < 1 || r.stars > 5)) return "별점을 다시 골라 주세요";
  if (r.spice !== undefined && (!Number.isInteger(r.spice) || r.spice < 1 || r.spice > 5)) return "맵기를 다시 골라 주세요";
  if ((r.text?.length ?? 0) > 80) return "한 줄 후기는 80자까지예요";
  return null;
}

// 주소 글에서 구·동을 뽑는다. 주소 검색 API(도로명주소 승인키)를 받으면 이 함수를 바꾼다.
const GU_SLUGS: Record<string, string> = { 마포구: "mapo", 서대문구: "seodaemun" };

export function parseAddress(address: string): { gu: string; dong: string } {
  const words = address.trim().split(/\s+/);
  const guWord = words.find((w) => /구$/.test(w));
  const dongWord = words.find((w) => /[동가리]$/.test(w) && !/구$/.test(w)) ?? words.find((w) => /(로|길)$/.test(w));
  return { gu: (guWord && GU_SLUGS[guWord]) ?? "etc", dong: dongWord ?? guWord ?? words[0] ?? "" };
}

// 일주일 안에 제보됐고 아직 「맞아요」가 모자란 가게
export function isPending(s: Pick<Store, "createdAt" | "verify">, now: Date) {
  return !!s.createdAt && daysSince(s.createdAt, now) <= VERIFY_DAYS && (s.verify?.yes ?? 0) < VERIFY_YES;
}

// 「확인이 필요해요」 사유. 비어 있으면 손볼 것이 없는 가게다.
export function updateReasons(s: Pick<Store, "photos" | "hours" | "lastConfirmedAt">, now: Date): string[] {
  const out: string[] = [];
  const days = daysSince(s.lastConfirmedAt, now);
  if (days >= OLD_DAYS) out.push(days < 365 ? `${Math.floor(days / 30)}달 전 확인` : "1년 넘게 확인 안 됨");
  if (!s.photos?.length) out.push("사진 없음");
  if (!s.hours) out.push("영업시간 없음");
  return out;
}
