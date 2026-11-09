import { describe, expect, it } from "vitest";
import { MAX_PHOTOS, MIN_PHOTOS, VERIFY_DAYS, VERIFY_YES, checkNewStore, isPending, parseAddress, type NewStoreInput } from "@/lib/wiki";

// 등록 검증 규칙 (lib/wiki.ts). 기대값은 소스의 문구·조건을 그대로 옮긴 것이다.

const VALID: NewStoreInput = {
  name: "테스트 떡볶이",
  address: "서울 마포구 합정동 1-1",
  lat: 37.5496,
  lng: 126.9139,
  grade: "bunsik",
  rice: ["wheat"],
  style: "soup",
  spice: 3,
  menu: [{ name: "떡볶이", price: 4000 }],
  photos: ["11111111-1111-4111-8111-111111111111"],
};

describe("checkNewStore", () => {
  it("빈 입력은 첫 필수 칸(가게 이름)부터 걸린다", () => {
    expect(checkNewStore({})).toBe("가게 이름을 넣어 주세요");
  });

  it("필수 칸이 비면 그 칸의 문구가 순서대로 나온다", () => {
    expect(checkNewStore({ ...VALID, address: "  " })).toBe("주소를 넣어 주세요");
    expect(checkNewStore({ ...VALID, lat: undefined })).toBe("지도에서 가게 위치를 골라 주세요");
    // 한국 밖 좌표도 위치를 안 고른 것으로 본다
    expect(checkNewStore({ ...VALID, lat: 35.68, lng: 139.69 })).toBe("지도에서 가게 위치를 골라 주세요");
    expect(checkNewStore({ ...VALID, grade: undefined })).toBe("어떤 가게인지 골라 주세요");
    expect(checkNewStore({ ...VALID, rice: [] })).toBe("떡을 하나 이상 골라 주세요");
    expect(checkNewStore({ ...VALID, style: undefined })).toBe("스타일을 골라 주세요");
    expect(checkNewStore({ ...VALID, spice: undefined })).toBe("맵기를 골라 주세요");
    expect(checkNewStore({ ...VALID, menu: [{ name: "", price: 4000 }] })).toBe("대표 메뉴 이름을 넣어 주세요");
    expect(checkNewStore({ ...VALID, menu: [{ name: "떡볶이", price: 100 }] })).toBe("「떡볶이」 가격을 다시 봐 주세요");
  });

  it(`사진은 ${MIN_PHOTOS}장 이상 ${MAX_PHOTOS}장 이하`, () => {
    expect(checkNewStore({ ...VALID, photos: [] })).toBe(`간판이나 메뉴판 사진을 ${MIN_PHOTOS}장 이상 올려 주세요`);
    expect(checkNewStore({ ...VALID, photos: undefined })).toBe(`간판이나 메뉴판 사진을 ${MIN_PHOTOS}장 이상 올려 주세요`);
    expect(checkNewStore({ ...VALID, photos: Array(MAX_PHOTOS + 1).fill("p") })).toBe(`사진은 ${MAX_PHOTOS}장까지 올릴 수 있어요`);
    expect(checkNewStore({ ...VALID, photos: Array(MAX_PHOTOS).fill("p") })).toBeNull();
  });

  it("소개글의 전화번호·링크는 막는다", () => {
    expect(checkNewStore({ ...VALID, memo: "문의는 010-1234-5678" })).toBe("소개글에는 전화번호를 넣을 수 없어요");
    expect(checkNewStore({ ...VALID, memo: "자세한 건 https://example.com" })).toBe("소개글에는 링크를 넣을 수 없어요");
  });

  it("정상 입력은 null", () => {
    expect(checkNewStore(VALID)).toBeNull();
    expect(checkNewStore({ ...VALID, stars: 4, memo: "밀떡이 쫄깃해요", hours: { days: [1, 2, 3], open: "10:00", close: "20:00" } })).toBeNull();
  });
});

describe("isPending — 등록 뒤 VERIFY_DAYS(7일) 안 · 맞아요 VERIFY_YES(3) 미만", () => {
  // daysSince 는 createdAt 을 KST 자정으로 읽고 floor 한다. now 를 KST 정오로 고정해 경계를 본다.
  const now = new Date("2026-11-09T12:00:00+09:00");
  const at = (d: string, yes = 0) => ({ createdAt: d, verify: { yes, no: 0 } });

  it("6일 → 확인 중", () => {
    expect(isPending(at("2026-11-03"), now)).toBe(true);
  });
  it(`${VERIFY_DAYS}일(경계) → 아직 확인 중 (<=)`, () => {
    expect(isPending(at("2026-11-02"), now)).toBe(true);
  });
  it("8일 → 끝", () => {
    expect(isPending(at("2026-11-01"), now)).toBe(false);
  });
  it(`맞아요 ${VERIFY_YES}명이면 날짜와 상관없이 끝`, () => {
    expect(isPending(at("2026-11-09", VERIFY_YES), now)).toBe(false);
    expect(isPending(at("2026-11-09", VERIFY_YES - 1), now)).toBe(true);
  });
  it("createdAt 이 없는 가게(예시·관리자 등록)는 확인 중이 아니다", () => {
    expect(isPending({ createdAt: undefined, verify: undefined }, now)).toBe(false);
  });
});

describe("parseAddress — 주소 글에서 구·동", () => {
  it("서울 마포구 합정동 → mapo / 합정동", () => {
    expect(parseAddress("서울 마포구 합정동 123-4")).toEqual({ gu: "mapo", dong: "합정동" });
  });
  it("서대문구 → seodaemun", () => {
    expect(parseAddress("서울특별시 서대문구 연희동 5")).toEqual({ gu: "seodaemun", dong: "연희동" });
  });
  it("동이 없고 도로명만 있으면 로·길을 동 자리에 쓴다", () => {
    expect(parseAddress("서울 마포구 월드컵로 12")).toEqual({ gu: "mapo", dong: "월드컵로" });
  });
  it("모르는 구는 etc, 동은 그대로", () => {
    expect(parseAddress("부산 해운대구 우동 1")).toEqual({ gu: "etc", dong: "우동" });
  });
  it("못 읽는 주소: 구는 etc, 동은 첫 낱말 (빈 주소면 빈 문자열)", () => {
    expect(parseAddress("어딘가 123")).toEqual({ gu: "etc", dong: "어딘가" });
    expect(parseAddress("   ")).toEqual({ gu: "etc", dong: "" });
  });
});
