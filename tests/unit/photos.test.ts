import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// 사진 저장소 (lib/data/photos.ts) — Supabase Storage 설정이 있을 때 · 없을 때 · Vercel 에서 없을 때.
// db.ts 가 DATA_DIR 을 처음 읽힐 때 고정하므로 db.test.ts 와 같이 env 를 먼저 바꾸고 새로 읽는다.

type Photos = typeof import("@/lib/data/photos");

const ID = "11111111-1111-4111-8111-111111111111";
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);
const ENV_KEYS = ["DATA_DIR", "DATABASE_URL", "VERCEL", "HASH_SALT", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_PHOTO_BUCKET"] as const;

let photos: Photos;
let dir: string;
let saved: Record<string, string | undefined>;

// Vercel 에서는 HASH_SALT · DATABASE_URL 이 비면 db.ts 가 불러올 때 멈춘다. pg.ts 는 처음 읽고 쓸 때 불러오므로 가짜 주소면 된다
function vercelDb() {
  process.env.HASH_SALT = "test-salt";
  process.env.DATABASE_URL = "postgres://test:test@127.0.0.1:1/none";
}

async function load() {
  vi.resetModules();
  photos = await import("@/lib/data/photos");
}

beforeEach(async () => {
  saved = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
  dir = mkdtempSync(path.join(os.tmpdir(), "ddy-photo-test-"));
  process.env.DATA_DIR = dir;
  process.env.DATABASE_URL = "";
  for (const k of ["VERCEL", "HASH_SALT", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_PHOTO_BUCKET"] as const) delete process.env[k];
  await load();
});

afterEach(() => {
  vi.unstubAllGlobals();
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
  rmSync(dir, { recursive: true, force: true });
});

describe("Storage 설정 없음 → 서버 폴더", () => {
  it("폴더에 쓰고 다시 읽는다", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    expect(photos.photoStore()).toBe("file");
    expect(await photos.savePhoto(ID, JPEG)).toEqual({ ok: true });
    const file = path.join(dir, "photos", `${ID}.jpg`);
    expect(existsSync(file)).toBe(true);
    expect(readFileSync(file).equals(JPEG)).toBe(true);

    const r = await photos.readPhoto(ID);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.contentType).toBe("image/jpeg");
      expect(Buffer.from(r.body as Uint8Array).equals(JPEG)).toBe(true);
    }
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("없는 사진 · 이상한 id 는 404", async () => {
    expect(await photos.readPhoto("22222222-2222-4222-8222-222222222222")).toEqual({ ok: false, status: 404 });
    expect(await photos.readPhoto("../db")).toEqual({ ok: false, status: 404 });
    expect((await photos.savePhoto("../db", JPEG)).ok).toBe(false);
  });

  it("URL 만 있고 키가 없으면 설정 없음으로 본다", async () => {
    process.env.SUPABASE_URL = "https://abc.supabase.co";
    expect(photos.photoStore()).toBe("file");
  });
});

describe("Vercel + Storage 설정 없음 → 올리기 거절", () => {
  it("503 으로 거절하고 /tmp 에 쓰지 않는다", async () => {
    process.env.VERCEL = "1";
    vercelDb();
    await load();
    expect(photos.photoStore()).toBe("none");
    const r = await photos.savePhoto(ID, JPEG);
    expect(r).toMatchObject({ ok: false, status: 503 });
    if (!r.ok) expect(r.error).toContain("사진");
    expect(existsSync(path.join(dir, "photos", `${ID}.jpg`))).toBe(false);
  });
});

describe("Storage 설정 있음 → Supabase Storage", () => {
  beforeEach(() => {
    process.env.SUPABASE_URL = "https://abc.supabase.co/";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-key";
  });

  it("올리기: POST /storage/v1/object/{bucket}/{id}.jpg · 헤더", async () => {
    const fetchSpy = vi.fn(async () => new Response(JSON.stringify({ Key: `photos/${ID}.jpg` }), { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);
    expect(photos.photoStore()).toBe("storage");
    expect(await photos.savePhoto(ID, JPEG)).toEqual({ ok: true });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(`https://abc.supabase.co/storage/v1/object/photos/${ID}.jpg`);
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      apikey: "service-key",
      authorization: "Bearer service-key",
      "content-type": "image/jpeg",
      "x-upsert": "false",
    });
    expect(Buffer.from(init.body as Uint8Array).equals(JPEG)).toBe(true);
    // 서버 폴더에는 쓰지 않는다
    expect(existsSync(path.join(dir, "photos"))).toBe(false);
  });

  it("버킷 이름을 바꿀 수 있다", async () => {
    process.env.SUPABASE_PHOTO_BUCKET = "store-photos";
    const fetchSpy = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);
    await photos.savePhoto(ID, JPEG);
    expect((fetchSpy.mock.calls[0] as unknown as [string])[0]).toBe(`https://abc.supabase.co/storage/v1/object/store-photos/${ID}.jpg`);
  });

  it("Storage 가 거절하면 502", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 500 })));
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await photos.savePhoto(ID, JPEG)).toMatchObject({ ok: false, status: 502 });
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("network"); }));
    expect(await photos.savePhoto(ID, JPEG)).toMatchObject({ ok: false, status: 502 });
  });

  it("읽기: GET /storage/v1/object/authenticated/{bucket}/{id}.jpg", async () => {
    const fetchSpy = vi.fn(async () => new Response(new Uint8Array(JPEG), { status: 200, headers: { "content-type": "image/jpeg" } }));
    vi.stubGlobal("fetch", fetchSpy);
    const r = await photos.readPhoto(ID);
    expect(r.ok).toBe(true);
    const [url, init] = fetchSpy.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(`https://abc.supabase.co/storage/v1/object/authenticated/photos/${ID}.jpg`);
    expect(init.method ?? "GET").toBe("GET");
    expect(init.headers).toMatchObject({ apikey: "service-key", authorization: "Bearer service-key" });
    if (r.ok) expect(Buffer.from(await new Response(r.body).arrayBuffer()).equals(JPEG)).toBe(true);
  });

  it("없는 사진은 404, Storage 장애는 502", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn(async () => new Response('{"statusCode":"404","error":"not_found"}', { status: 400 })));
    expect(await photos.readPhoto(ID)).toEqual({ ok: false, status: 404 });
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 404 })));
    expect(await photos.readPhoto(ID)).toEqual({ ok: false, status: 404 });
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 503 })));
    expect(await photos.readPhoto(ID)).toEqual({ ok: false, status: 502 });
  });

  it("Vercel 에서도 설정이 있으면 Storage 로 올린다", async () => {
    process.env.VERCEL = "1";
    vercelDb();
    await load();
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 200 })));
    expect(photos.photoStore()).toBe("storage");
    expect(await photos.savePhoto(ID, JPEG)).toEqual({ ok: true });
  });
});
