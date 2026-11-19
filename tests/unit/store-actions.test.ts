import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SPICE_LEVELS } from "@/lib/taxonomy";
import type { NewStoreInput } from "@/lib/wiki";
import { HIDE_AT, checkPatch, checkReview, goneNotice } from "@/lib/wiki";
import { seedDataDir } from "../fixtures/seed";

// 가게 상세에서 이용자가 하는 일 (lib/data/db.ts) — 아직 있어요 · 신고 · 후기 신고 · 평가 · 달라요 · 정보 고치기.
// db.test.ts 와 같은 격리: 테스트마다 임시 DATA_DIR + 파일 저장소, 모듈을 새로 읽는다.

type Db = typeof import("@/lib/data/db");
type Who = import("@/lib/data/db").Who;

let db: Db;
let dir: string;

const who = (n: string): Who => ({ nick: `손님${n}`, device: `device-${n}`, ip: `10.0.0.${n}` });

const input = (p: Partial<NewStoreInput> = {}): NewStoreInput => ({
  name: "시험 떡볶이",
  address: "서울 마포구 합정동 1-1",
  lat: 37.5496,
  lng: 126.9139,
  grade: "bunsik",
  rice: ["wheat"],
  style: "soup",
  spice: 3,
  menu: [{ name: "떡볶이", price: 4000 }],
  photos: [],
  ...p,
});

// 예시 가게는 status 칸이 없다 (없으면 active — lib/types.ts)
const statusOf = async (id: string) => (await db.readStore(id))?.status ?? "active";

async function newStore() {
  const res = await db.addStore(input(), who("0"));
  if (!res.ok) throw new Error(res.error);
  return res.id;
}

beforeEach(async () => {
  dir = mkdtempSync(path.join(os.tmpdir(), "ddy-store-actions-"));
  process.env.DATA_DIR = dir;
  seedDataDir(dir); // 시험 자료(가게 16곳 · 글 · 리스트)로 채운 저장소에서 시작한다
  process.env.DATABASE_URL = "";
  delete (globalThis as { __ddyQueue?: unknown }).__ddyQueue;
  vi.resetModules();
  db = await import("@/lib/data/db");
});

afterEach(() => {
  vi.useRealTimers();
  rmSync(dir, { recursive: true, force: true });
});

describe("confirmStill — 같은 사람·같은 가게·한국 시간 같은 날 한 번 (F006)", () => {
  it("같은 날 두 번째는 「오늘은 이미 확인해 주셨어요」(409), 다른 사람은 된다", async () => {
    const [s] = await db.readStores();
    expect(await db.confirmStill(s.id, who("1"))).toEqual({ ok: true });
    expect((await db.readStore(s.id))?.lastConfirmedAt).toBe(db.isoDay());
    expect(await db.confirmStill(s.id, who("1"))).toMatchObject({ ok: false, status: 409, error: "오늘은 이미 확인해 주셨어요" });
    expect(await db.confirmStill(s.id, who("2"))).toEqual({ ok: true });
  });

  it("한국 시간 0~9시 경계: 00:30 에 누르고 08:00 에 다시 누르면 같은 날이라 거절 (UTC 로는 다른 날)", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const [s] = await db.readStores();
    vi.setSystemTime(new Date("2026-11-18T15:30:00Z")); // 한국 11-19 00:30
    expect(await db.confirmStill(s.id, who("1"))).toEqual({ ok: true });
    expect((await db.readStore(s.id))?.lastConfirmedAt).toBe("2026-11-19");
    vi.setSystemTime(new Date("2026-11-18T23:00:00Z")); // 한국 11-19 08:00
    expect(await db.confirmStill(s.id, who("1"))).toMatchObject({ ok: false, status: 409 });
  });

  it("한국 시간 날이 바뀌면 다시 된다: 23:30 → 다음 날 00:30", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const [s] = await db.readStores();
    vi.setSystemTime(new Date("2026-11-18T14:30:00Z")); // 한국 11-18 23:30
    expect(await db.confirmStill(s.id, who("1"))).toEqual({ ok: true });
    vi.setSystemTime(new Date("2026-11-18T15:30:00Z")); // 한국 11-19 00:30
    expect(await db.confirmStill(s.id, who("1"))).toEqual({ ok: true });
    expect((await db.readStore(s.id))?.lastConfirmedAt).toBe("2026-11-19");
  });
});

describe(`flagStore — 서로 다른 ${HIDE_AT}명이면 지도에서 내린다 (F019)`, () => {
  it("「문을 닫았어요」가 과반이면 closed, 지도 목록에서 빠지고 이력에 남는다", async () => {
    const [s] = await db.readStores();
    expect((await db.flagStore(s.id, "closed", who("1"))).ok).toBe(true);
    expect((await db.flagStore(s.id, "closed", who("2"))).ok).toBe(true);
    expect(await statusOf(s.id)).toBe("active");
    expect(await db.flagStore(s.id, "ad", who("3"))).toEqual({ ok: true, status: "closed" });
    const data = await import("@/lib/data");
    expect((await data.getStores()).some((x) => x.id === s.id)).toBe(false);
    expect((await db.readHistory(s.id))[0]).toMatchObject({ kind: "closed", who: "지도" });
  });

  it("폐업이 과반이 아니면 hidden", async () => {
    const [s] = await db.readStores();
    await db.flagStore(s.id, "closed", who("1"));
    await db.flagStore(s.id, "ad", who("2"));
    expect(await db.flagStore(s.id, "wrong", who("3"))).toEqual({ ok: true, status: "hidden" });
  });

  it("같은 사람 두 번째 신고는 「이미 신고해 주셨어요. 고마워요!」, 신고 수는 그대로", async () => {
    const [s] = await db.readStores();
    await db.flagStore(s.id, "closed", who("1"));
    expect(await db.flagStore(s.id, "closed", who("1"))).toMatchObject({ ok: false, status: 409, error: "이미 신고해 주셨어요. 고마워요!" });
    // 2명이 더 신고해야 내려간다 (같은 사람 두 번째가 세지 않았다)
    expect((await db.flagStore(s.id, "closed", who("2"))).ok).toBe(true);
    expect(await statusOf(s.id)).toBe("active");
    expect(await db.flagStore(s.id, "closed", who("3"))).toEqual({ ok: true, status: "closed" });
  });
});

describe(`flagReview — 후기는 신고 ${HIDE_AT}명이면 숨김 (F019)`, () => {
  it("2명이면 그대로 보이고, 3명째에 가려진다", async () => {
    const [s] = await db.readStores();
    const [review] = await db.readReviews(s.id);
    expect(review).toBeDefined();
    expect(await db.flagReview(review.id, who("1"))).toEqual({ ok: true });
    expect(await db.flagReview(review.id, who("2"))).toEqual({ ok: true });
    expect((await db.readReviews(s.id)).some((r) => r.id === review.id)).toBe(true);
    expect(await db.flagReview(review.id, who("2"))).toMatchObject({ ok: false, status: 409, error: "이미 신고해 주셨어요. 고마워요!" });
    expect(await db.flagReview(review.id, who("3"))).toEqual({ ok: true });
    expect((await db.readReviews(s.id)).some((r) => r.id === review.id)).toBe(false);
  });
});

describe("checkReview · reviewStore — 별 필수, 같은 사람 가게당 평가 하나 (F020)", () => {
  it("별 없이 후기만 쓰면 「별점을 골라 주세요」", () => {
    expect(checkReview({ text: "맛있어요" })).toBe("별점을 골라 주세요");
    expect(checkReview({ stars: 4, text: "맛있어요" })).toBeNull();
  });

  it("별 3 → 다시 별 5: 평가는 한 개, 값만 5 로 바뀌고 평균·개수도 한 표로 센다", async () => {
    const id = await newStore();
    expect(await db.reviewStore(id, { stars: 3, text: "그럭저럭" }, who("1"))).toEqual({ ok: true });
    expect(await db.reviewStore(id, { stars: 5, text: "다시 가 보니 최고" }, who("1"))).toEqual({ ok: true });
    const mine = (await db.readReviews(id)).filter((r) => r.who === "손님1");
    expect(mine).toHaveLength(1);
    expect(mine[0]).toMatchObject({ stars: 5, text: "다시 가 보니 최고" });
    expect((await db.readStore(id))?.rating).toEqual({ avg: 5, count: 1 });
  });

  it("별 5 · 4 · 4 · 4 → 평균 4.3 (반올림한 평균으로 합계를 되살리면 4.2 가 된다)", async () => {
    const id = await newStore();
    for (const [i, stars] of [5, 4, 4, 4].entries()) expect(await db.reviewStore(id, { stars }, who(String(i + 1)))).toEqual({ ok: true });
    expect((await db.readStore(id))?.rating).toEqual({ avg: 4.3, count: 4 });
  });

  it("평가가 60건 쌓여도 저장된 평균이 평가 줄의 실제 평균과 같다", async () => {
    const id = await newStore();
    const all = Array.from({ length: 60 }, (_, i) => ((i * 7) % 5) + 1);
    // 한 사람 하루 한도와 무관하게 서로 다른 60명이 쓴다
    for (const [i, stars] of all.entries()) expect(await db.reviewStore(id, { stars }, { nick: `손님${i}`, device: `device-r${i}`, ip: `10.1.${i}.1` })).toEqual({ ok: true });
    const avg = Math.round((all.reduce((a, b) => a + b, 0) / all.length) * 10) / 10;
    expect((await db.readStore(id))?.rating).toEqual({ avg, count: 60 });
  });
});

describe(`verifyStore — 달라요 ${HIDE_AT}명이면 지도에서 내린다 (F017)`, () => {
  it("서로 다른 3명이 달라요 → hidden, 지도 목록에서 빠지고 이력에 「숨김」", async () => {
    const id = await newStore();
    for (let i = 1; i < HIDE_AT; i++) expect(await db.verifyStore(id, false, who(String(i)))).toMatchObject({ ok: true, no: i, status: "active" });
    expect(await db.verifyStore(id, false, who(String(HIDE_AT)))).toMatchObject({ ok: true, no: HIDE_AT, status: "hidden" });
    const data = await import("@/lib/data");
    expect((await data.getStores()).some((x) => x.id === id)).toBe(false);
    expect((await db.readHistory(id))[0]).toMatchObject({ kind: "hidden", who: "지도" });
  });
});

describe("checkPatch · editStore — 정보 고치기 (F018)", () => {
  it("대표 메뉴 이름을 비우면 「대표 메뉴 이름을 넣어 주세요」", () => {
    expect(checkPatch({ menu: [{ name: " ", price: 4000 }] })).toBe("대표 메뉴 이름을 넣어 주세요");
    expect(checkPatch({ menu: [{ name: "떡볶이", price: 4000 }] })).toBeNull();
  });

  it("맵기 3 → 4 로 저장하면 마지막 확인일이 오늘, 이력에 맵기 칸이 남는다", async () => {
    const s = (await db.readStores()).find((x) => x.spice === 3 && x.lastConfirmedAt < db.isoDay())!;
    expect(s).toBeDefined();
    expect(await db.editStore(s.id, { spice: 4 }, who("1"))).toEqual({ ok: true });
    const after = (await db.readStore(s.id))!;
    expect(after.spice).toBe(4);
    expect(after.lastConfirmedAt).toBe(db.isoDay());
    const [h] = await db.readHistory(s.id);
    expect(h.kind).toBe("edit");
    // 지금 코드의 이력 모양: 「3 · 신라면 정도 → 4 · …」 (PRD F018 수용 기준과 같다)
    expect(h.changes).toEqual([{ field: "맵기", from: `3 · ${SPICE_LEVELS[3].ref}`, to: `4 · ${SPICE_LEVELS[4].ref}` }]);
  });
});

describe("goneNotice — 내려간 가게 맨 위 안내를 까닭별로 (F005)", () => {
  const auto = (kind: "hidden" | "closed") => [{ kind }];
  const admin = (kind: "hidden" | "closed") => [{ kind, changes: [{ field: "상태" }] }];

  it("올라가 있는 가게는 안내 없음", () => {
    expect(goneNotice({ status: "active" }, [])).toBeNull();
    expect(goneNotice({}, [])).toBeNull();
  });
  it("신고로 문 닫음 / 운영자가 문 닫음", () => {
    expect(goneNotice({ status: "closed" }, auto("closed"))).toBe("문을 닫았다는 신고가 쌓여 지도에서 내렸어요.");
    expect(goneNotice({ status: "closed" }, admin("closed"))).toBe("운영자가 문을 닫은 것을 확인해서 지도에서 내렸어요.");
  });
  it("달라요로 숨김 / 신고로 숨김 / 운영자가 숨김", () => {
    expect(goneNotice({ status: "hidden", verify: { yes: 0, no: HIDE_AT } }, auto("hidden"))).toBe("사실과 다르다는 의견이 쌓여 지도에서 내렸어요.");
    expect(goneNotice({ status: "hidden", verify: { yes: 0, no: 1 } }, auto("hidden"))).toBe("신고가 쌓여 지도에서 내렸어요.");
    expect(goneNotice({ status: "hidden", verify: { yes: 0, no: HIDE_AT } }, admin("hidden"))).toBe("운영자가 확인해서 지도에서 내렸어요.");
  });
  it("이력은 최근 것부터 — 마지막 숨김 줄을 따른다", () => {
    expect(goneNotice({ status: "hidden" }, [{ kind: "edit" }, ...admin("hidden"), ...auto("hidden")])).toBe("운영자가 확인해서 지도에서 내렸어요.");
  });
  it("저장소에서 실제로 내린 가게도 같은 문구가 나온다", async () => {
    const id = await newStore();
    for (let i = 1; i <= HIDE_AT; i++) await db.verifyStore(id, false, who(String(i)));
    expect(goneNotice((await db.readStore(id))!, await db.readHistory(id))).toBe("사실과 다르다는 의견이 쌓여 지도에서 내렸어요.");
    const [s] = await db.readStores();
    for (const n of ["1", "2", "3"]) await db.flagStore(s.id, "ad", who(n));
    expect(goneNotice((await db.readStore(s.id))!, await db.readHistory(s.id))).toBe("신고가 쌓여 지도에서 내렸어요.");
  });
});
