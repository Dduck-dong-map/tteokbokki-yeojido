import { freshness, isOpenNow } from "./freshness";
import { RICE_CAKES, STYLES, type RiceCake, type Spice, type Style } from "./taxonomy";
import type { Hours, Store } from "./types";

// 필터는 주소(URL)에 담아 그대로 공유할 수 있게 한다 (기획안 6절)
// 예: /?rice=rice,cheese&style=soup&spice=2-4&price=5000&open=1&days=0,6&solo=1&menu=0
export type Filters = {
  rice: RiceCake[];
  style: Style[];
  spice: [Spice, Spice];
  priceMax: number | null;
  openNow: boolean;
  days: number[]; // 영업 요일 (0 = 일 … 6 = 토, Hours.days 와 같은 숫자). 고른 요일 모두에 여는 가게만. 지금 시각과는 무관하다
  solo: boolean;
  showMenuGrade: boolean; // '메뉴에 있음' 가게도 보이기
};

export const DEFAULT_FILTERS: Filters = {
  rice: [],
  style: [],
  spice: [1, 5],
  priceMax: null,
  openNow: false,
  days: [],
  solo: false,
  showMenuGrade: true,
};

const list = <T extends string>(v: string | null, allowed: Record<string, string>) =>
  (v ? v.split(",").filter((x) => x in allowed) : []) as T[];

// 요일: 0~6 만 받고, 겹친 값은 버리고 작은 수부터 늘어놓는다
const dayList = (v: string | null) => [...new Set((v ?? "").split(",").filter((x) => /^[0-6]$/.test(x)).map(Number))].sort((a, b) => a - b);

const clampSpice = (n: number) => Math.min(5, Math.max(1, Math.round(n) || 1)) as Spice;

export function parseFilters(q: URLSearchParams): Filters {
  const [a, b] = (q.get("spice") ?? "1-5").split("-").map(Number);
  const lo = clampSpice(a);
  const hi = clampSpice(b ?? a);
  const price = Number(q.get("price"));
  return {
    rice: list<RiceCake>(q.get("rice"), RICE_CAKES),
    style: list<Style>(q.get("style"), STYLES),
    spice: [Math.min(lo, hi), Math.max(lo, hi)] as [Spice, Spice],
    priceMax: price > 0 ? price : null,
    openNow: q.get("open") === "1",
    days: dayList(q.get("days")),
    solo: q.get("solo") === "1",
    showMenuGrade: q.get("menu") !== "0",
  };
}

export function serializeFilters(f: Filters): string {
  const q = new URLSearchParams();
  if (f.rice.length) q.set("rice", f.rice.join(","));
  if (f.style.length) q.set("style", f.style.join(","));
  if (f.spice[0] !== 1 || f.spice[1] !== 5) q.set("spice", `${f.spice[0]}-${f.spice[1]}`);
  if (f.priceMax) q.set("price", String(f.priceMax));
  if (f.openNow) q.set("open", "1");
  const days = dayList(f.days.join(","));
  if (days.length) q.set("days", days.join(","));
  if (f.solo) q.set("solo", "1");
  if (!f.showMenuGrade) q.set("menu", "0");
  return q.toString();
}

export function activeFilterCount(f: Filters) {
  return (
    (f.rice.length ? 1 : 0) +
    (f.style.length ? 1 : 0) +
    (f.spice[0] !== 1 || f.spice[1] !== 5 ? 1 : 0) +
    (f.priceMax ? 1 : 0) +
    (f.openNow ? 1 : 0) +
    (f.days.length ? 1 : 0) +
    (f.solo ? 1 : 0) +
    (f.showMenuGrade ? 0 : 1)
  );
}

// 고른 요일 모두에 여는 가게인지. 영업시간을 모르는 가게는 「지금 영업 중」과 같이 뺀다.
// 자정을 넘기는 가게도 여는 날(hours.days)로만 본다 — 전날 영업이 새벽으로 넘어온 것은 세지 않는다
export function opensOn(hours: Hours | undefined, days: number[]) {
  if (!days.length) return true;
  if (!hours) return false;
  return days.every((d) => hours.days.includes(d));
}

// 365일 넘은 가게는 어떤 필터에서도 빼고, 나머지에 조건을 건다
export function applyFilters(stores: Store[], f: Filters, now: Date): Store[] {
  return stores.filter(
    (s) =>
      freshness(s, now) !== "expired" &&
      (f.showMenuGrade || s.grade !== "menu") &&
      (!f.rice.length || s.rice.some((r) => f.rice.includes(r))) &&
      (!f.style.length || f.style.includes(s.style)) &&
      s.spice >= f.spice[0] &&
      s.spice <= f.spice[1] &&
      (!f.priceMax || s.price <= f.priceMax) &&
      (!f.openNow || isOpenNow(s.hours, now)) &&
      opensOn(s.hours, f.days) &&
      (!f.solo || s.usage.includes("solo")),
  );
}

// 검색창: 가게 이름·동·주소로 바로 거른다 (슬랙 10-28: 접속 즉시 주변 가게 → 검색 → 선택 → 상세 → 길찾기)
export function matchQuery(s: Store, q: string) {
  const k = q.replace(/\s+/g, "").toLowerCase();
  if (!k) return true;
  return [s.name, s.dong, s.address, s.gu].some((v) => v.replace(/\s+/g, "").toLowerCase().includes(k));
}

// 최근 확인된 가게를 위에 (가슴속 3천원 방식)
export const byRecentlyConfirmed = (a: Store, b: Store) => b.lastConfirmedAt.localeCompare(a.lastConfirmedAt);

export function distanceM(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6_371_000;
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function distanceText(m: number) {
  return m < 1000 ? `${Math.round(m / 10) * 10}m` : `${(m / 1000).toFixed(1)}km`;
}

export const won = (n: number) => n.toLocaleString("ko-KR") + "원";
