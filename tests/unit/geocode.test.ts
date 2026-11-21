import { afterEach, describe, expect, it, vi } from "vitest";

// 주소 → 좌표 (components/map/geocode.ts, 11-21). 네이버 지도 스크립트 대신 가짜 window.naver 를 둔다.
// 키(NEXT_PUBLIC_NAVER_MAP_KEY)는 모듈이 처음 읽힐 때 박히므로 env 를 먼저 바꾸고 resetModules + 동적 import.

type Reply = { status: number; addresses?: { x: string; y: string; roadAddress?: string }[] } | "silent";

function fakeNaver(reply: Reply, withService = true) {
  const queries: string[] = [];
  const Service = {
    Status: { OK: 200, ERROR: 500 },
    geocode: (o: { query: string }, cb: (status: number, res?: unknown) => void) => {
      queries.push(o.query);
      if (reply !== "silent") cb(reply.status, { v2: { addresses: reply.addresses ?? [] } });
    },
  };
  (globalThis as { window?: unknown }).window = { naver: { maps: { jsContentLoaded: true, ...(withService ? { Service } : {}) } } };
  return queries;
}

async function load(key = "test-key") {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_NAVER_MAP_KEY", key);
  return import("@/components/map/geocode");
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
  delete (globalThis as { window?: unknown }).window;
});

describe("geocode", () => {
  it("찾으면 첫 결과의 y=위도 · x=경도 · 도로명을 준다 (주소 앞뒤 빈칸은 뺀다)", async () => {
    const queries = fakeNaver({ status: 200, addresses: [{ x: "127.1266690", y: "37.3945280", roadAddress: "경기도 성남시 분당구 이매로 54" }] });
    const { geocode, canGeocode } = await load();
    expect(canGeocode).toBe(true);
    expect(await geocode("  경기 성남시 분당구 이매로 54 ")).toEqual({ lat: 37.394528, lng: 127.126669, road: "경기도 성남시 분당구 이매로 54" });
    expect(queries).toEqual(["경기 성남시 분당구 이매로 54"]);
  });

  it("결과가 없거나 · 오류이거나 · 우리나라 밖 좌표면 null", async () => {
    fakeNaver({ status: 200, addresses: [] });
    expect(await (await load()).geocode("없는 주소 999")).toBeNull();
    fakeNaver({ status: 500 });
    expect(await (await load()).geocode("서울 마포구 망원동 1")).toBeNull();
    fakeNaver({ status: 200, addresses: [{ x: "0", y: "0" }] });
    expect(await (await load()).geocode("서울 마포구 망원동 1")).toBeNull();
  });

  it("geocoder 서브모듈이 없으면(Service 없음) null · 너무 짧은 주소는 묻지 않는다", async () => {
    fakeNaver({ status: 200, addresses: [{ x: "127", y: "37.5" }] }, false);
    expect(await (await load()).geocode("서울 마포구 망원동 1")).toBeNull();
    const queries = fakeNaver({ status: 200, addresses: [{ x: "127", y: "37.5" }] });
    expect(await (await load()).geocode("서울")).toBeNull();
    expect(queries).toEqual([]);
  });

  it("네이버가 답을 안 주면 8초 뒤 null", async () => {
    fakeNaver("silent");
    const { geocode } = await load();
    vi.useFakeTimers();
    const p = geocode("서울 마포구 망원동 1");
    await vi.advanceTimersByTimeAsync(8000);
    expect(await p).toBeNull();
  });

  it("키가 없으면(시험 · 로컬) 주소 찾기를 끈다", async () => {
    const queries = fakeNaver({ status: 200, addresses: [{ x: "127", y: "37.5" }] });
    const { geocode, canGeocode } = await load("");
    expect(canGeocode).toBe(false);
    expect(await geocode("서울 마포구 망원동 1")).toBeNull();
    expect(queries).toEqual([]);
  });
});
