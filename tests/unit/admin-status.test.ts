import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NewStoreInput } from "@/lib/wiki";
import { HIDE_AT, goneNotice } from "@/lib/wiki";

// 운영자 되살리기 (lib/data/admin.ts adminSetStatus · F012). 신고·달라요로 내려간 가게를 되살린 뒤
// 예전에 쌓인 수 때문에 신고 1건 · 달라요 1표로 곧바로 다시 내려가지 않아야 한다. 격리 방식은 admin.test.ts 와 같다.

type Admin = typeof import("@/lib/data/admin");
type Db = typeof import("@/lib/data/db");
type Who = import("@/lib/data/db").Who;

let admin: Admin;
let db: Db;
let dir: string;

const who = (n: string): Who => ({ nick: `손님${n}`, device: `device-${n}`, ip: `10.0.0.${n}` });

const input = (): NewStoreInput => ({
  name: "되살릴 떡볶이",
  address: "서울 마포구 합정동 1-1",
  lat: 37.5496,
  lng: 126.9139,
  grade: "bunsik",
  rice: ["wheat"],
  style: "soup",
  spice: 3,
  menu: [{ name: "떡볶이", price: 4000 }],
  photos: [],
});

beforeEach(async () => {
  dir = mkdtempSync(path.join(os.tmpdir(), "ddy-admin-status-"));
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

const onMap = async (id: string) => (await (await import("@/lib/data")).getStores()).some((s) => s.id === id);

describe("adminSetStatus — 되살리기 (F012)", () => {
  it("신고 3명으로 내려간 가게를 되살리면 지도 목록에 나오고 운영 기록에 한 줄 남는다", async () => {
    const [s] = await db.readStores();
    for (const n of ["1", "2", "3"]) await db.flagStore(s.id, "closed", who(n));
    expect((await db.readStore(s.id))?.status).toBe("closed");
    expect(await onMap(s.id)).toBe(false);

    const before = (await admin.adminReadLogs()).length;
    expect(await admin.adminSetStatus(s.id, "active")).toEqual({ ok: true });
    expect(await onMap(s.id)).toBe(true);
    const logs = await admin.adminReadLogs();
    expect(logs).toHaveLength(before + 1);
    expect(logs[0]).toMatchObject({ storeId: s.id, kind: "edit", who: "운영자", changes: [{ field: "상태", from: "폐업", to: "보임" }] });
  });

  it("되살린 뒤 신고 1건으로 다시 내려가지 않는다 — 되살린 뒤 새로 3명이 쌓여야 내려간다", async () => {
    const [s] = await db.readStores();
    for (const n of ["1", "2", "3"]) await db.flagStore(s.id, "ad", who(n));
    expect((await db.readStore(s.id))?.status).toBe("hidden");
    await admin.adminSetStatus(s.id, "active");

    expect(await db.flagStore(s.id, "ad", who("4"))).toEqual({ ok: true, status: "active" });
    expect(await onMap(s.id)).toBe(true);
    // 되살리기 전에 신고한 사람은 다시 신고할 수 없다 (한 사람 한 번)
    expect(await db.flagStore(s.id, "ad", who("1"))).toMatchObject({ ok: false, status: 409 });
    expect(await db.flagStore(s.id, "ad", who("5"))).toEqual({ ok: true, status: "active" });
    expect(await db.flagStore(s.id, "closed", who("6"))).toEqual({ ok: true, status: "hidden" });
  });

  it("달라요 3표로 내려간 가게를 되살리면 달라요 수가 0 이 되고, 달라요 1표로 다시 내려가지 않는다", async () => {
    const added = await db.addStore(input(), who("0"));
    if (!added.ok) throw new Error(added.error);
    const id = added.id;
    for (let i = 1; i <= HIDE_AT; i++) await db.verifyStore(id, false, who(String(i)));
    expect((await db.readStore(id))?.status).toBe("hidden");

    await admin.adminSetStatus(id, "active");
    expect((await db.readStore(id))?.verify).toEqual({ yes: 0, no: 0 });
    expect(await db.verifyStore(id, false, who("4"))).toMatchObject({ ok: true, no: 1, status: "active" });
    expect(await onMap(id)).toBe(true);
    // 이미 표를 낸 사람은 되살린 뒤에도 다시 못 낸다
    expect(await db.verifyStore(id, false, who("1"))).toMatchObject({ ok: false, status: 409 });
  });

  it("운영자가 숨기면 가게 상세 안내가 「운영자가 확인해서 지도에서 내렸어요.」", async () => {
    const [s] = await db.readStores();
    await admin.adminSetStatus(s.id, "hidden", "정보 확인 중");
    expect(goneNotice((await db.readStore(s.id))!, await db.readHistory(s.id))).toBe("운영자가 확인해서 지도에서 내렸어요.");
    await admin.adminSetStatus(s.id, "closed");
    expect(goneNotice((await db.readStore(s.id))!, await db.readHistory(s.id))).toBe("운영자가 문을 닫은 것을 확인해서 지도에서 내렸어요.");
  });
});
