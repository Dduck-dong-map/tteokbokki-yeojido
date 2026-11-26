import { describe, expect, it } from "vitest";
import { DEFAULT_FILTERS, activeFilterCount, applyFilters, distanceM, distanceText, matchQuery, opensOn, parseFilters, serializeFilters, won } from "@/lib/filters";
import type { Store } from "@/lib/types";

// 거리·가격 표시 규칙과 필터 적용 (lib/filters.ts)

describe("distanceM — 하버사인", () => {
  it("같은 점은 0", () => {
    const p = { lat: 37.5665, lng: 126.978 };
    expect(distanceM(p, p)).toBe(0);
  });
  it("서울시청 ↔ 합정역 ≈ 5.7km ±5% (지시문 기준) — 공식상 정확값은 5,954.6m", () => {
    const d = distanceM({ lat: 37.5665, lng: 126.978 }, { lat: 37.5496, lng: 126.9139 });
    expect(d).toBeGreaterThan(5700 * 0.95);
    expect(d).toBeLessThan(5700 * 1.05);
    expect(d).toBeCloseTo(5954.6, 0);
  });
  it("방향을 바꿔도 같다", () => {
    const a = { lat: 37.5563, lng: 126.9019 };
    const b = { lat: 37.5557, lng: 126.9063 };
    expect(distanceM(a, b)).toBeCloseTo(distanceM(b, a), 6);
  });
});

describe("distanceText", () => {
  it("1km 미만은 10m 단위, 그 위는 소수 한 자리 km", () => {
    expect(distanceText(0)).toBe("0m");
    expect(distanceText(954)).toBe("950m");
    expect(distanceText(1234)).toBe("1.2km");
  });
});

describe("won", () => {
  it("천 단위 쉼표 + 원", () => {
    expect(won(0)).toBe("0원");
    expect(won(4500)).toBe("4,500원");
    expect(won(12000)).toBe("12,000원");
  });
});

// 필터 테스트용 최소 가게. lastConfirmedAt 은 now 기준 신선하게 둔다.
const NOW = new Date("2026-11-09T12:00:00+09:00");
const base: Store = {
  id: "t1",
  name: "테스트",
  grade: "bunsik",
  lat: 37.55,
  lng: 126.91,
  address: "서울 마포구 합정동 1",
  gu: "mapo",
  dong: "합정동",
  rice: ["wheat"],
  style: "soup",
  spice: 2,
  taste: [],
  sides: [],
  usage: ["solo"],
  price: 4000,
  priceCheckedAt: "2026-11-01",
  menu: [{ name: "떡볶이", price: 4000 }],
  lastConfirmedAt: "2026-11-01",
};
const stores: Store[] = [
  base,
  { ...base, id: "t2", rice: ["rice"], style: "rose", spice: 4, price: 6000, usage: [] },
  { ...base, id: "t3", grade: "menu", spice: 1, price: 3000 },
  { ...base, id: "old", lastConfirmedAt: "2025-01-01" }, // 365일 넘음 → 어떤 필터에서도 빠진다
];

describe("applyFilters", () => {
  it("기본 필터는 만료(365일 넘음)만 뺀다", () => {
    expect(applyFilters(stores, DEFAULT_FILTERS, NOW).map((s) => s.id)).toEqual(["t1", "t2", "t3"]);
  });
  it("조건에 맞는 가게가 없으면 0곳", () => {
    expect(applyFilters(stores, { ...DEFAULT_FILTERS, rice: ["bunmoja"] }, NOW)).toHaveLength(0);
    expect(applyFilters(stores, { ...DEFAULT_FILTERS, priceMax: 1000 }, NOW)).toHaveLength(0);
  });
  it("떡·스타일·맵기·가격·혼밥·메뉴등급이 각각 걸린다", () => {
    expect(applyFilters(stores, { ...DEFAULT_FILTERS, rice: ["rice"] }, NOW).map((s) => s.id)).toEqual(["t2"]);
    expect(applyFilters(stores, { ...DEFAULT_FILTERS, style: ["soup"] }, NOW).map((s) => s.id)).toEqual(["t1", "t3"]);
    expect(applyFilters(stores, { ...DEFAULT_FILTERS, spice: [3, 5] }, NOW).map((s) => s.id)).toEqual(["t2"]);
    expect(applyFilters(stores, { ...DEFAULT_FILTERS, priceMax: 4000 }, NOW).map((s) => s.id)).toEqual(["t1", "t3"]);
    expect(applyFilters(stores, { ...DEFAULT_FILTERS, solo: true }, NOW).map((s) => s.id)).toEqual(["t1", "t3"]);
    expect(applyFilters(stores, { ...DEFAULT_FILTERS, showMenuGrade: false }, NOW).map((s) => s.id)).toEqual(["t1", "t2"]);
  });
  it("영업시간을 모르는 가게는 「지금 영업 중」에 안 들어간다", () => {
    expect(applyFilters(stores, { ...DEFAULT_FILTERS, openNow: true }, NOW)).toHaveLength(0);
  });
});

describe("parseFilters ↔ serializeFilters", () => {
  it("기본값은 빈 문자열로, 바꾼 값만 주소에 남는다", () => {
    expect(serializeFilters(DEFAULT_FILTERS)).toBe("");
    const f = parseFilters(new URLSearchParams("rice=rice,cheese&style=soup&spice=2-4&price=5000&open=1&solo=1&menu=0"));
    expect(f).toEqual({ rice: ["rice", "cheese"], style: ["soup"], spice: [2, 4], priceMax: 5000, openNow: true, days: [], solo: true, showMenuGrade: false });
    expect(parseFilters(new URLSearchParams(serializeFilters(f)))).toEqual(f);
    expect(activeFilterCount(f)).toBe(7);
  });
  it("모르는 값은 버리고 맵기는 1~5 로 잘라 정렬한다", () => {
    const f = parseFilters(new URLSearchParams("rice=unknown&spice=9-0&price=-1"));
    expect(f.rice).toEqual([]);
    expect(f.spice).toEqual([1, 5]);
    expect(f.priceMax).toBeNull();
  });
});

// 요일 숫자는 Hours.days 와 같다: 0 = 일 … 6 = 토
describe("영업 요일 필터 (days)", () => {
  const ids = (f: Partial<typeof DEFAULT_FILTERS>) => applyFilters(dayStores, { ...DEFAULT_FILTERS, ...f }, NOW).map((s) => s.id);
  const dayStores: Store[] = [
    { ...base, id: "all", hours: { days: [0, 1, 2, 3, 4, 5, 6], open: "11:00", close: "21:00" } },
    { ...base, id: "noSun", rice: ["rice"], hours: { days: [1, 2, 3, 4, 5, 6], open: "11:00", close: "21:00" } },
    { ...base, id: "weekdays", hours: { days: [1, 2, 3, 4, 5], open: "11:00", close: "21:00" } },
    { ...base, id: "night", hours: { days: [6], open: "18:00", close: "02:00" } }, // 토요일 밤에 열어 일요일 새벽에 닫는다
    { ...base, id: "unknown" }, // 영업시간 모름
  ];

  it("주소 값: 0~6 만 받고, 겹친 값·모르는 값은 버리고 정렬한다", () => {
    expect(parseFilters(new URLSearchParams("")).days).toEqual([]);
    expect(parseFilters(new URLSearchParams("days=0")).days).toEqual([0]);
    expect(parseFilters(new URLSearchParams("days=6,0,6,7,-1,x,1.5,,%200")).days).toEqual([0, 6]);
    expect(parseFilters(new URLSearchParams("days=sun")).days).toEqual([]);
  });
  it("비어 있으면 키를 쓰지 않고, 고르면 정렬해서 쓴다 (왕복)", () => {
    expect(serializeFilters({ ...DEFAULT_FILTERS, days: [] })).toBe("");
    expect(serializeFilters({ ...DEFAULT_FILTERS, days: [0] })).toBe("days=0");
    expect(new URLSearchParams(serializeFilters({ ...DEFAULT_FILTERS, days: [6, 0, 6, 9] })).get("days")).toBe("0,6");
    const f = { ...DEFAULT_FILTERS, days: [0, 6], openNow: true };
    expect(parseFilters(new URLSearchParams(serializeFilters(f)))).toEqual(f);
  });
  it("요일을 고르지 않으면 영업시간을 모르는 가게도 남는다", () => {
    expect(ids({})).toEqual(["all", "noSun", "weekdays", "night", "unknown"]);
  });
  it("요일 하나: 그 요일에 여는 가게만, 영업시간을 모르는 가게는 뺀다", () => {
    expect(ids({ days: [0] })).toEqual(["all"]);
    expect(ids({ days: [6] })).toEqual(["all", "noSun", "night"]);
    expect(ids({ days: [3] })).toEqual(["all", "noSun", "weekdays"]);
  });
  it("여러 요일: 고른 요일 모두에 여는 가게만 (AND)", () => {
    expect(ids({ days: [0, 6] })).toEqual(["all"]);
    expect(ids({ days: [5, 6] })).toEqual(["all", "noSun"]);
  });
  it("자정을 넘기는 가게는 여는 날로만 센다 (토요일 밤 → 일요일 새벽은 일요일이 아니다)", () => {
    expect(opensOn({ days: [6], open: "18:00", close: "02:00" }, [0])).toBe(false);
    expect(opensOn({ days: [6], open: "18:00", close: "02:00" }, [6])).toBe(true);
    expect(opensOn(undefined, [])).toBe(true);
    expect(opensOn(undefined, [1])).toBe(false);
  });
  it("다른 필터와 함께 걸린다", () => {
    expect(ids({ days: [6], rice: ["rice"] })).toEqual(["noSun"]);
    // NOW = 월요일 12:00 → 「지금 영업 중」은 all · noSun · weekdays, 거기에 토요일 조건
    expect(ids({ openNow: true })).toEqual(["all", "noSun", "weekdays"]);
    expect(ids({ openNow: true, days: [6] })).toEqual(["all", "noSun"]);
  });
  it("요일을 하나라도 고르면 켜진 필터 +1", () => {
    expect(activeFilterCount(DEFAULT_FILTERS)).toBe(0);
    expect(activeFilterCount({ ...DEFAULT_FILTERS, days: [0] })).toBe(1);
    expect(activeFilterCount({ ...DEFAULT_FILTERS, days: [0, 6] })).toBe(1);
  });
});

describe("matchQuery — 이름·동·주소·구로 찾기 (띄어쓰기·대소문자 무시)", () => {
  it("빈 검색어는 모두 통과", () => {
    expect(matchQuery(base, "  ")).toBe(true);
  });
  it("동·이름으로 맞고, 없는 말은 안 맞는다", () => {
    expect(matchQuery(base, "합 정")).toBe(true);
    expect(matchQuery(base, "테스트")).toBe(true);
    expect(matchQuery(base, "강남")).toBe(false);
  });
});
