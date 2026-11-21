import { daysSince } from "./freshness";
import { GRADES, RICE_CAKES, STYLES, USAGES, type Grade, type RiceCake, type Spice, type Style, type Usage } from "./taxonomy";
import type { Hours, MenuItem, Store } from "./types";

// 「모두가 고치는 지도」 규칙 (거지맵 구도를 추린 MVP, 11-04 · docs/기획/MVP_거지맵구도_2026-11-04.md)
// 등록은 사전 승인 없이 바로 올라가고, 이용자들이 뒤에서 걸러 낸다.
// 화면과 서버가 같은 규칙으로 검사한다.

export const VERIFY_DAYS = 7; // 새 가게는 일주일 동안 「확인 중」으로 보인다
export const VERIFY_YES = 3; // 「맞아요」 3명이면 확인 완료
export const HIDE_AT = 3; // 「달라요」 또는 신고가 3명 쌓이면 지도에서 내린다. 「3명」= 서로 다른 접속 위치(IP) 3곳 — 같은 곳에서 기기 표시만 바꾼 것은 한 명으로 센다 (11-18)
export const MIN_PHOTOS = 0; // 새 가게 등록에 필요한 사진 (간판이나 메뉴판). 써 보기 동안은 0 = 없어도 등록 (W1-3) — 사진 저장소를 붙이면 1 로 되돌린다
export const MAX_PHOTOS = 5;
export const DAILY_PHOTOS = 30; // 한 사람 하루(최근 24시간) 사진 올리기
export const DAILY_PHOTOS_PER_IP = 150; // 같은 접속 위치(IP) 전체의 하루 사진 상한 = 다섯 사람 몫. 기기 표시만 바꿔 한도를 넘는 것을 막는다 (11-18)
export const MAX_MENU = 5;
export const DAILY_LIMIT = 10; // 한 사람(기기와 접속 위치가 모두 같으면 한 사람) 하루 등록·수정 10건
export const DAILY_LIMIT_PER_IP = 50; // 같은 접속 위치(IP) 전체의 하루 등록·수정 상한. 기기 표시만 바꿔 한도를 넘는 것을 막는다 (11-18)
export const DUP_RADIUS_M = 80; // 이 거리 안에 같은 이름이 있으면 이미 있는 가게로 본다
export const MAX_INTRO = 500; // 소개글 글자 수
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
  memo?: string; // 소개글 (선택)
  hours?: Hours; // 영업시간 (선택)
  notDuplicate?: boolean; // 「다른 가게예요」를 눌러 이름이 비슷해도 올린다
};

// 정보 고치기: 맵기(대표 메뉴 기준)도 여기서 고친다. 사진은 더하기만 한다.
export type StorePatch = {
  name?: string;
  address?: string;
  lat?: number;
  lng?: number;
  grade?: Grade;
  rice?: RiceCake[];
  style?: Style;
  spice?: Spice;
  menu?: MenuItem[];
  hours?: Hours | null;
  usage?: Usage[];
  memo?: string;
  addPhotos?: string[];
};

export const inKorea = (lat: number, lng: number) => lat > 33 && lat < 39 && lng > 124 && lng < 132;

function checkMenu(menu: MenuItem[] | undefined): string | null {
  if (!menu?.length || !menu[0].name?.trim()) return "대표 메뉴 이름을 넣어 주세요";
  if (menu.length > MAX_MENU) return `메뉴는 ${MAX_MENU}개까지 넣을 수 있어요`;
  for (const m of menu) {
    if (!m.name?.trim() || m.name.length > 30) return "메뉴 이름을 다시 봐 주세요";
    if (!Number.isInteger(m.price) || m.price < 500 || m.price > 100000) return `「${m.name.trim()}」 가격을 다시 봐 주세요`;
  }
  return null;
}

// 소개글: 글자만. 전화번호·링크는 올리기 전에 막는다 (금칙어는 어드민에서 관리할 때 더한다, W2)
export function checkIntro(text: unknown): string | null {
  if (typeof text !== "string") return "소개글을 다시 봐 주세요";
  if (text.length > MAX_INTRO) return `소개글은 ${MAX_INTRO}자까지예요`;
  if (/(^|[^\d])0\d{1,2}[-.\s]?\d{3,4}[-.\s]?\d{4}(?!\d)/.test(text)) return "소개글에는 전화번호를 넣을 수 없어요";
  if (/https?:\/\/|www\.|[a-z0-9-]+\.(com|net|org|kr|me|io|co)(\/|\b)/i.test(text)) return "소개글에는 링크를 넣을 수 없어요";
  return null;
}

function checkHours(h: Hours): string | null {
  const time = /^([01]\d|2[0-3]):[0-5]\d$/;
  if (!time.test(h.open) || !time.test(h.close)) return "영업시간을 다시 봐 주세요";
  if (!Array.isArray(h.days) || !h.days.length || h.days.some((d) => !Number.isInteger(d) || d < 0 || d > 6)) return "여는 요일을 하나 이상 골라 주세요";
  return null;
}

const badSpice = (v: unknown) => !Number.isInteger(v) || (v as number) < 1 || (v as number) > 5;

export function checkNewStore(r: Partial<NewStoreInput>): string | null {
  if (!r.name?.trim() || r.name.length > 60) return "가게 이름을 넣어 주세요";
  if (!r.address?.trim() || r.address.length > 120) return "주소를 넣어 주세요";
  if (typeof r.lat !== "number" || typeof r.lng !== "number" || !inKorea(r.lat, r.lng)) return "지도에서 가게 위치를 골라 주세요";
  if (!r.grade || !(r.grade in GRADES)) return "어떤 가게인지 골라 주세요";
  if (!r.rice?.length || r.rice.some((x) => !(x in RICE_CAKES))) return "떡을 하나 이상 골라 주세요";
  if (!r.style || !(r.style in STYLES)) return "스타일을 골라 주세요";
  if (badSpice(r.spice)) return "맵기를 골라 주세요";
  if (r.stars !== undefined && (!Number.isInteger(r.stars) || r.stars < 1 || r.stars > 5)) return "별점을 다시 골라 주세요";
  const menuError = checkMenu(r.menu);
  if (menuError) return menuError;
  if ((r.photos?.length ?? 0) < MIN_PHOTOS) return `간판이나 메뉴판 사진을 ${MIN_PHOTOS}장 이상 올려 주세요`;
  if ((r.photos?.length ?? 0) > MAX_PHOTOS) return `사진은 ${MAX_PHOTOS}장까지 올릴 수 있어요`;
  if (r.memo !== undefined) {
    const e = checkIntro(r.memo);
    if (e) return e;
  }
  if (r.hours) {
    const e = checkHours(r.hours);
    if (e) return e;
  }
  return null;
}

export function checkPatch(p: StorePatch): string | null {
  if (p.name !== undefined && (!p.name.trim() || p.name.length > 60)) return "가게 이름을 다시 봐 주세요";
  if (p.address !== undefined && (!p.address.trim() || p.address.length > 120)) return "주소를 다시 봐 주세요";
  if ((p.lat !== undefined || p.lng !== undefined) && !(typeof p.lat === "number" && typeof p.lng === "number" && inKorea(p.lat, p.lng))) return "지도에서 위치를 다시 골라 주세요";
  if (p.grade !== undefined && !(p.grade in GRADES)) return "어떤 가게인지 골라 주세요";
  if (p.rice !== undefined && (!p.rice.length || p.rice.some((x) => !(x in RICE_CAKES)))) return "떡을 하나 이상 골라 주세요";
  if (p.style !== undefined && !(p.style in STYLES)) return "스타일을 골라 주세요";
  if (p.spice !== undefined && badSpice(p.spice)) return "맵기를 다시 골라 주세요";
  if (p.menu !== undefined) {
    const e = checkMenu(p.menu);
    if (e) return e;
  }
  if (p.usage !== undefined && p.usage.some((x) => !(x in USAGES))) return "이용 정보를 다시 골라 주세요";
  if (p.memo !== undefined) {
    const e = checkIntro(p.memo);
    if (e) return e;
  }
  if (p.hours) {
    const e = checkHours(p.hours);
    if (e) return e;
  }
  if (p.addPhotos !== undefined && p.addPhotos.length > MAX_PHOTOS) return `사진은 ${MAX_PHOTOS}장까지 올릴 수 있어요`;
  return null;
}

// 평가 = 별(필수) + 한 줄 후기. 맵기 투표는 메뉴별 구조와 함께 나중에 (웹 1차 기획 ADR-W06)
export function checkReview(r: { stars?: number; text?: string }): string | null {
  if (r.stars === undefined) return "별점을 골라 주세요";
  if (!Number.isInteger(r.stars) || r.stars < 1 || r.stars > 5) return "별점을 다시 골라 주세요";
  if ((r.text?.length ?? 0) > 80) return "한 줄 후기는 80자까지예요";
  return null;
}

// 주소 글에서 구·동을 뽑는다. 주소 검색 API(도로명주소 승인키)를 받으면 이 함수를 바꾼다.
export const GU_SLUGS: Record<string, string> = { 마포구: "mapo", 서대문구: "seodaemun", 강남구: "gangnam" };

export function parseAddress(address: string): { gu: string; dong: string } {
  const words = address.trim().split(/\s+/);
  const guWord = words.find((w) => /구$/.test(w));
  const dongWord = words.find((w) => /[동가리]$/.test(w) && !/구$/.test(w)) ?? words.find((w) => /(로|길)$/.test(w));
  return { gu: (guWord && GU_SLUGS[guWord]) ?? "etc", dong: dongWord ?? guWord ?? words[0] ?? "" };
}

// 일주일 안에 등록됐고 아직 「맞아요」가 모자란 가게
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

// 지도가 저절로 내린 줄(db.ts goneLog)에 남기는 까닭 칸 (11-19). 이력의 「바뀐 칸」 하나로 남아 변경 이력 화면에도 「내린 까닭 보임 → 달라요」로 보인다.
export const GONE_REASON_FIELD = "내린 까닭";
export const GONE_BY_VOTES = "달라요"; // 되살린 뒤 달라요를 낸 서로 다른 접속 위치가 HIDE_AT 곳 (db.ts verifyStore)
export const GONE_BY_FLAGS = "신고"; // 되살린 뒤 신고한 서로 다른 접속 위치가 HIDE_AT 곳 (db.ts flagStore)

// 내려간 가게(숨김·문 닫음)를 주소로 열었을 때 맨 위에 띄우는 안내 (F005). 내린 까닭에 따라 문구를 나눈다.
// 까닭은 이력(store_logs)의 마지막 「숨김」「폐업」 줄로 가른다:
//  - 운영자가 내림: 어드민 adminSetStatus 가 남긴 줄은 「상태」 바뀐 칸이 있다
//  - 지도가 저절로 내림(who 「지도」): 그 줄의 「내린 까닭」 칸(달라요 · 신고)을 따른다 — 내린 판정과 같은 기준 (11-19)
//  - 까닭 칸이 없는 옛 줄(11-19 전): 폐업 = 신고 · 숨김 = 달라요 표 수가 HIDE_AT 이상이면 달라요, 아니면 신고 (예전 그대로)
// 신고 이유(광고·엉뚱한 곳 등)는 가게 상세가 읽는 자료에 없어 「신고」 하나로 묶는다.
export function goneNotice(s: Pick<Store, "status" | "verify">, history: { kind: string; changes?: { field: string; to?: string }[] }[]): string | null {
  const status = s.status ?? "active";
  if (status === "active") return null;
  const last = history.find((h) => h.kind === "hidden" || h.kind === "closed"); // 이력은 최근 것부터
  const byAdmin = !!last?.changes?.some((c) => c.field === "상태");
  if (status === "closed") return byAdmin ? "운영자가 문을 닫은 것을 확인해서 지도에서 내렸어요." : "문을 닫았다는 신고가 쌓여 지도에서 내렸어요.";
  if (byAdmin) return "운영자가 확인해서 지도에서 내렸어요.";
  const reason = last?.changes?.find((c) => c.field === GONE_REASON_FIELD)?.to;
  const byVotes = reason !== undefined ? reason === GONE_BY_VOTES : (s.verify?.no ?? 0) >= HIDE_AT;
  if (byVotes) return "사실과 다르다는 의견이 쌓여 지도에서 내렸어요.";
  return last ? "신고가 쌓여 지도에서 내렸어요." : "지금은 지도에서 내린 가게예요.";
}
