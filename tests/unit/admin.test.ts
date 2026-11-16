import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// 운영 어드민 가게 관리 (lib/data/admin.ts, 11-15) — 파일 저장소 모드. db.test.ts 와 같은 격리 방식.

type Admin = typeof import("@/lib/data/admin");
type Db = typeof import("@/lib/data/db");
type Input = import("@/lib/data/admin").AdminStoreInput;

let admin: Admin;
let db: Db;
let dir: string;

const base = (p: Partial<Input> = {}): Input => ({
  name: "시험 떡볶이",
  grade: "specialist",
  lat: 37.5246,
  lng: 127.0376,
  address: "서울 강남구 압구정로50길 22",
  gu: "gangnam",
  dong: "신사동",
  rice: ["garae"],
  style: "classic",
  spice: 2,
  taste: ["sweet"],
  sides: ["twigim"],
  usage: ["solo"],
  price: 6000,
  priceCheckedAt: "2026-11-05",
  menu: [{ name: "떡볶이", price: 6000 }],
  lastConfirmedAt: "2026-11-05",
  ...p,
});

beforeEach(async () => {
  dir = mkdtempSync(path.join(os.tmpdir(), "ddy-admin-test-"));
  process.env.DATA_DIR = dir;
  process.env.DATABASE_URL = "";
  delete (globalThis as { __ddyQueue?: unknown }).__ddyQueue;
  vi.resetModules();
  db = await import("@/lib/data/db");
  admin = await import("@/lib/data/admin");
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe("checkAdminStore", () => {
  it("다 찬 가게는 통과", () => {
    expect(admin.checkAdminStore(base())).toBeNull();
  });
  it("빈 스타일·맵기·가격은 막는다 (리서치 빈 칸을 지어내지 않게)", () => {
    expect(admin.checkAdminStore({ ...base(), style: undefined })).toMatch("스타일");
    expect(admin.checkAdminStore({ ...base(), spice: undefined })).toMatch("맵기");
    expect(admin.checkAdminStore({ ...base(), price: undefined })).toMatch("가격");
  });
  it("한국 밖 좌표·없는 태그·맛 결 3개는 막는다", () => {
    expect(admin.checkAdminStore(base({ lat: 10 }))).toMatch("위도");
    expect(admin.checkAdminStore(base({ rice: ["pizza" as never] }))).toMatch("떡");
    expect(admin.checkAdminStore(base({ taste: ["sweet", "salty", "pepper"] }))).toMatch("맛 결");
  });
  it("영업시간은 요일 하나 이상 · HH:MM", () => {
    expect(admin.checkAdminStore(base({ hours: { days: [], open: "11:00", close: "20:00" } }))).toMatch("요일");
    expect(admin.checkAdminStore(base({ hours: { days: [1], open: "11:00", close: "24:00" } }))).toMatch("시간");
    expect(admin.checkAdminStore(base({ hours: { days: [1], open: "14:00", close: "00:00" } }))).toBeNull(); // 자정 넘김
  });
});

describe("직접 등록 · 수정 · 내리기", () => {
  it("등록하면 지도에 바로 보이고(확인 중 아님) 이력에 「등록」이 남는다", async () => {
    const r = await admin.adminCreateStore(base(), "gn-test");
    expect(r).toEqual({ ok: true, id: "gn-test" });
    const s = await admin.adminReadStore("gn-test");
    expect(s?.status).toBe("active");
    expect(s?.createdAt).toBeUndefined();
    const logs = await admin.adminReadLogs({ storeId: "gn-test" });
    expect(logs.map((l) => l.kind)).toEqual(["new"]);
    expect(logs[0].who).toBe(admin.ADMIN_NICK);
  });

  it("같은 id 는 두 번 못 만들고, 이상한 id 도 막는다", async () => {
    await admin.adminCreateStore(base(), "gn-test");
    expect(await admin.adminCreateStore(base(), "gn-test")).toMatchObject({ ok: false, status: 409 });
    expect(await admin.adminCreateStore(base(), "한글id")).toMatchObject({ ok: false });
    expect(await admin.adminCreateStore(base(), "new")).toMatchObject({ ok: false });
  });

  it("화면에서 끼워 넣은 칸(상태·예시·별점)은 저장하지 않는다", async () => {
    await admin.adminCreateStore({ ...base(), isSample: true, status: "hidden", rating: { avg: 5, count: 99 } }, "gn-test");
    const s = await admin.adminReadStore("gn-test");
    expect(s?.isSample).toBeUndefined();
    expect(s?.status).toBe("active");
    expect(s?.rating).toBeUndefined();
  });

  it("고치면 바뀐 칸만 이력에 남고, 바뀐 게 없으면 거절", async () => {
    await admin.adminCreateStore(base(), "gn-test");
    expect(await admin.adminSaveStore("gn-test", base())).toMatchObject({ ok: false, error: "바뀐 내용이 없어요" });
    const r = await admin.adminSaveStore("gn-test", base({ spice: 4, price: 6500, hours: { days: [1, 2, 3], open: "11:00", close: "21:00" } }));
    expect(r).toEqual({ ok: true, changes: 3 });
    const [last] = await admin.adminReadLogs({ storeId: "gn-test" });
    expect(last.kind).toBe("edit");
    expect(last.changes?.map((c) => c.field)).toEqual(["맵기", "대표 가격", "영업시간"]);
  });

  it("영업시간·가게 유형을 비우면 칸이 지워진다", async () => {
    await admin.adminCreateStore(base({ shopType: "market", hours: { days: [1], open: "10:00", close: "17:00" } }), "gn-test");
    await admin.adminSaveStore("gn-test", base());
    const s = await admin.adminReadStore("gn-test");
    expect(s?.hours).toBeUndefined();
    expect(s?.shopType).toBeUndefined();
  });

  it("숨기기 → 지도 목록(getStores)에서 빠지고, 되살리면 돌아온다", async () => {
    await admin.adminCreateStore(base({ lastConfirmedAt: db.isoDay() }), "gn-test");
    const data = await import("@/lib/data");
    expect((await data.getStores()).some((s) => s.id === "gn-test")).toBe(true);
    expect(await admin.adminSetStatus("gn-test", "hidden", "정보 확인 중")).toEqual({ ok: true });
    expect((await data.getStores()).some((s) => s.id === "gn-test")).toBe(false);
    expect(await admin.adminSetStatus("gn-test", "hidden")).toMatchObject({ ok: false });
    expect(await admin.adminSetStatus("gn-test", "active")).toEqual({ ok: true });
    expect((await data.getStores()).some((s) => s.id === "gn-test")).toBe(true);
    const kinds = (await admin.adminReadLogs({ storeId: "gn-test" })).map((l) => l.kind);
    expect(kinds).toEqual(["edit", "hidden", "new"]);
  });

  it("오늘 확인함은 하루 한 번", async () => {
    await admin.adminCreateStore(base(), "gn-test");
    expect(await admin.adminConfirm("gn-test")).toMatchObject({ ok: true, at: db.isoDay() });
    expect(await admin.adminConfirm("gn-test")).toMatchObject({ ok: false, status: 409 });
  });
});

describe("자료 묶음 넣기", () => {
  it("빈 칸이 남은 가게와 이미 있는 가게는 건너뛰고, 덮어쓰지 않는다", async () => {
    await admin.adminCreateStore(base({ name: "원래 이름" }), "gn-a");
    const r = await admin.adminImport(
      [
        { id: "gn-a", store: base({ name: "자료 이름" }), missing: [] },
        { id: "gn-b", store: base(), missing: [] },
        { id: "gn-c", store: { ...base(), style: undefined }, missing: ["스타일"] },
      ],
      "운영 · 시험 자료",
    );
    expect(r.added).toEqual(["gn-b"]);
    expect(r.skipped).toEqual([
      { id: "gn-a", why: "이미 있음" },
      { id: "gn-c", why: "빈 칸: 스타일" },
    ]);
    expect((await admin.adminReadStore("gn-a"))?.name).toBe("원래 이름");
    expect((await admin.adminReadLogs({ storeId: "gn-b" }))[0].who).toBe("운영 · 시험 자료");
  });

  it("강남 v1 자료: 빈 칸 없는 가게는 모두 검사를 통과한다", async () => {
    const { DATASETS } = await import("@/lib/data/datasets");
    const ds = DATASETS.find((d) => d.id === "gangnam-v1")!;
    expect(ds.stores.length).toBe(26);
    const ready = ds.stores.filter((r) => !r.missing.length);
    for (const r of ready) expect([r.id, admin.checkAdminStore(admin.pickInput(r.store))]).toEqual([r.id, null]);
    const res = await admin.adminImport(ds.stores, ds.who);
    expect(res.added.length).toBe(ready.length);
    expect(new Set(ds.stores.map((r) => r.id)).size).toBe(26);
  });

  it("마포 v1 자료: 빈 칸 없는 가게는 모두 검사를 통과하고 강남 id 와 겹치지 않는다", async () => {
    const { DATASETS } = await import("@/lib/data/datasets");
    const ds = DATASETS.find((d) => d.id === "mapo-v1")!;
    expect(ds.stores.length).toBe(19);
    const ready = ds.stores.filter((r) => !r.missing.length);
    expect(ready.length).toBe(14);
    for (const r of ready) expect([r.id, admin.checkAdminStore(admin.pickInput(r.store))]).toEqual([r.id, null]);
    const all = DATASETS.flatMap((d) => d.stores.map((r) => r.id));
    expect(new Set(all).size).toBe(all.length);
    const res = await admin.adminImport(ds.stores, ds.who);
    expect(res.added.length).toBe(ready.length);
  });
});
