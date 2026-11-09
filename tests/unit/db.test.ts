import { existsSync, mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NewStoreInput } from "@/lib/wiki";
import { DAILY_LIMIT, VERIFY_YES, isPending } from "@/lib/wiki";

// 저장소 규칙 (lib/data/db.ts) — 파일 저장소 모드.
// db.ts 는 DATA_DIR 과 DATABASE_URL 을 모듈이 처음 읽힐 때 고정하므로,
// 테스트마다 env 를 먼저 바꾸고 vi.resetModules() + 동적 import 로 새로 읽는다.

type Db = typeof import("@/lib/data/db");
type Who = import("@/lib/data/db").Who;

let db: Db;
let dir: string;

const who = (n: string): Who => ({ nick: `손님${n}`, device: `device-${n}`, ip: `10.0.0.${n}` });

const input = (p: Partial<NewStoreInput> = {}): NewStoreInput => ({
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
  ...p,
});

beforeEach(async () => {
  dir = mkdtempSync(path.join(os.tmpdir(), "ddy-db-test-"));
  process.env.DATA_DIR = dir;
  process.env.DATABASE_URL = ""; // 빈 문자열 → PG 꺼짐 (파일 저장소)
  delete (globalThis as { __ddyQueue?: unknown }).__ddyQueue; // 쓰기 줄은 전역이라 테스트마다 비운다
  vi.resetModules();
  db = await import("@/lib/data/db");
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe("격리", () => {
  it("DATA_DIR 이 임시 폴더를 가리키고, 첫 쓰기 뒤 db.json 이 거기 생긴다", async () => {
    expect(db.DATA_DIR).toBe(dir);
    expect(existsSync(path.join(dir, "db.json"))).toBe(false);
    const res = await db.addStore(input(), who("1"));
    expect(res.ok).toBe(true);
    expect(existsSync(path.join(dir, "db.json"))).toBe(true);
  });

  it("예시 데이터가 시드된다", async () => {
    const stores = await db.readStores();
    expect(stores.length).toBeGreaterThan(0);
    expect(stores.every((s) => s.isSample)).toBe(true);
  });
});

describe("addStore — 80m 안 같은 이름은 이미 있는 가게", () => {
  it("예시 가게 바로 옆에 같은 이름 → { ok:false, existing: 그 가게 id, 409 }", async () => {
    const [sample] = await db.readStores();
    // 위도 0.0003° ≈ 33m
    const res = await db.addStore(input({ name: sample.name, lat: sample.lat + 0.0003, lng: sample.lng }), who("1"));
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.existing).toBe(sample.id);
    expect(res.status).toBe(409);
    expect(res.error).toContain(sample.name);
  });

  it("「다른 가게예요」(notDuplicate) 를 누르면 같은 자리라도 올라간다", async () => {
    const [sample] = await db.readStores();
    const res = await db.addStore(input({ name: sample.name, lat: sample.lat, lng: sample.lng, notDuplicate: true }), who("1"));
    expect(res.ok).toBe(true);
  });

  it("이름이 다르면 같은 자리라도 새 가게", async () => {
    const [sample] = await db.readStores();
    const res = await db.addStore(input({ name: "전혀 다른 이름", lat: sample.lat, lng: sample.lng }), who("1"));
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const saved = await db.readStore(res.id);
    expect(saved?.status).toBe("active");
    expect(saved?.verify).toEqual({ yes: 0, no: 0 });
    expect(saved?.gu).toBe("mapo");
    expect(saved?.dong).toBe("합정동");
  });
});

describe(`addStore — 같은 기기 하루 ${DAILY_LIMIT}건 한도`, () => {
  it(`${DAILY_LIMIT}번째까지 되고 ${DAILY_LIMIT + 1}번째는 429`, async () => {
    const me = who("1");
    for (let i = 0; i < DAILY_LIMIT; i++) {
      // 서로 멀리 떨어뜨려 중복 검사에 안 걸리게 한다 (위도 0.01° ≈ 1.1km)
      const res = await db.addStore(input({ name: `가게 ${i}`, lat: 37.4 + i * 0.01 }), me);
      expect(res.ok, `${i + 1}번째`).toBe(true);
    }
    const over = await db.addStore(input({ name: "한 번 더", lat: 37.3 }), me);
    expect(over.ok).toBe(false);
    if (over.ok) return;
    expect(over.status).toBe(429);
    expect(over.error).toBe("오늘은 등록·수정을 많이 해 주셨어요. 내일 다시 부탁드려요");
  });

  it("다른 기기·다른 접속 위치는 한도를 따로 센다", async () => {
    for (let i = 0; i < DAILY_LIMIT; i++) {
      await db.addStore(input({ name: `가게 ${i}`, lat: 37.4 + i * 0.01 }), who("1"));
    }
    const other = await db.addStore(input({ name: "다른 사람 가게", lat: 37.3 }), who("2"));
    expect(other.ok).toBe(true);
  });

  it("기기가 달라도 접속 위치가 같으면 같은 사람으로 센다", async () => {
    for (let i = 0; i < DAILY_LIMIT; i++) {
      await db.addStore(input({ name: `가게 ${i}`, lat: 37.4 + i * 0.01 }), who("1"));
    }
    const sameIp = await db.addStore(input({ name: "같은 와이파이", lat: 37.3 }), { ...who("9"), ip: who("1").ip });
    expect(sameIp.ok).toBe(false);
  });
});

describe(`verifyStore — 맞아요 ${VERIFY_YES}명이면 확인 끝`, () => {
  it("새 가게에 서로 다른 사람이 맞아요를 누르면 3번째에 확인이 끝나고 이력에 남는다", async () => {
    const added = await db.addStore(input(), who("0"));
    expect(added.ok).toBe(true);
    if (!added.ok) return;
    const id = added.id;
    expect(isPending((await db.readStore(id))!, new Date())).toBe(true);

    for (let i = 1; i <= VERIFY_YES; i++) {
      const res = await db.verifyStore(id, true, who(String(i)));
      expect(res.ok, `${i}번째 맞아요`).toBe(true);
      if (res.ok) expect(res.yes).toBe(i);
    }
    const s = (await db.readStore(id))!;
    expect(s.verify).toEqual({ yes: VERIFY_YES, no: 0 });
    expect(isPending(s, new Date())).toBe(false);
    expect((await db.readHistory(id)).some((h) => h.kind === "verified")).toBe(true);

    // 확인이 끝난 뒤에는 더 못 누른다
    const late = await db.verifyStore(id, true, who("7"));
    expect(late.ok).toBe(false);
    if (!late.ok) expect(late.error).toBe("이미 확인이 끝난 가게예요");
  });

  it("같은 기기는 가게마다 한 표", async () => {
    const added = await db.addStore(input(), who("0"));
    if (!added.ok) throw new Error(added.error);
    expect((await db.verifyStore(added.id, true, who("1"))).ok).toBe(true);
    const again = await db.verifyStore(added.id, false, who("1"));
    expect(again.ok).toBe(false);
    if (!again.ok) expect(again.status).toBe(409);
  });

  it("예시 가게(createdAt 없음)는 확인 대상이 아니다", async () => {
    const [sample] = await db.readStores();
    const res = await db.verifyStore(sample.id, true, who("1"));
    expect(res.ok).toBe(false);
  });
});

describe("맛집 리스트 — 만든 기기만 고친다", () => {
  it("다른 기기의 updateList · editListStores 는 403, 만든 기기는 된다", async () => {
    const owner = who("1");
    const stranger = who("2");
    const created = await db.createList({ title: "내 리스트", visibility: "public" }, owner);
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const id = created.id;

    const denied = await db.updateList(id, { title: "남이 고침" }, stranger);
    expect(denied.ok).toBe(false);
    if (!denied.ok) {
      expect(denied.status).toBe(403);
      expect(denied.error).toBe("이 기기에서 만든 리스트만 고칠 수 있어요");
    }
    const [sample] = await db.readStores();
    const deniedAdd = await db.editListStores(id, { kind: "add", storeId: sample.id }, stranger);
    expect(deniedAdd.ok).toBe(false);

    const allowed = await db.updateList(id, { title: "내가 고침" }, owner);
    expect(allowed.ok).toBe(true);
    expect((await db.readList(id))?.title).toBe("내가 고침");
  });

  it("같은 접속 위치라도 기기가 다르면 남의 것이다 (리스트 소유는 기기로만 본다)", async () => {
    const owner = who("1");
    const created = await db.createList({ title: "내 리스트", visibility: "link" }, owner);
    if (!created.ok) throw new Error(created.error);
    const sameWifi = await db.updateList(created.id, { title: "x" }, { ...who("5"), ip: owner.ip });
    expect(sameWifi.ok).toBe(false);
  });

  it("기기 표시가 없는 브라우저(no-device)는 리스트를 만들 수 없다", async () => {
    const res = await db.createList({ title: "익명", visibility: "public" }, { nick: "손님", device: "no-device", ip: "1.1.1.1" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.status).toBe(400);
  });
});
