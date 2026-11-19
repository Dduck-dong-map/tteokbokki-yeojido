import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { seedDataDir } from "../fixtures/seed";

// 사진 저장소 (lib/data/photos.ts) — Vercel Blob 설정이 있을 때 · 없을 때 · Vercel 에서 없을 때.
// Blob SDK 는 가짜로 바꿔 넣는다(실제 저장소에 올리지 않는다).
// db.ts 가 DATA_DIR 을 처음 읽힐 때 고정하므로 db.test.ts 와 같이 env 를 먼저 바꾸고 새로 읽는다.

type Photos = typeof import("@/lib/data/photos");

const ID = "11111111-1111-4111-8111-111111111111";
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);
const ENV_KEYS = ["DATA_DIR", "DATABASE_URL", "VERCEL", "HASH_SALT", "BLOB_STORE_ID", "BLOB_READ_WRITE_TOKEN"] as const;

// vi.resetModules 로 photos.ts 를 새로 읽어도 같은 가짜 함수를 쓰게 끌어올려 둔다
const blob = vi.hoisted(() => ({ put: vi.fn(), get: vi.fn() }));
vi.mock("@vercel/blob", () => {
  class BlobNotFoundError extends Error {}
  return { put: blob.put, get: blob.get, BlobNotFoundError };
});

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
  seedDataDir(dir); // 시험 자료(가게 16곳 · 글 · 리스트)로 채운 저장소에서 시작한다
  process.env.DATABASE_URL = "";
  for (const k of ["VERCEL", "HASH_SALT", "BLOB_STORE_ID", "BLOB_READ_WRITE_TOKEN"] as const) delete process.env[k];
  blob.put.mockReset();
  blob.get.mockReset();
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

describe("Blob 설정 없음 → 서버 폴더", () => {
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

  it("빈 값은 설정 없음으로 본다", async () => {
    process.env.BLOB_STORE_ID = "  ";
    process.env.BLOB_READ_WRITE_TOKEN = "";
    expect(photos.photoStore()).toBe("file");
    expect(await photos.savePhoto(ID, JPEG)).toEqual({ ok: true });
    expect(blob.put).not.toHaveBeenCalled();
  });
});

describe("Vercel + Blob 설정 없음 → 올리기 거절", () => {
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

describe("Blob 설정 있음 → Vercel Blob 비공개 저장소", () => {
  beforeEach(() => {
    process.env.BLOB_STORE_ID = "store_test";
  });

  it("올리기: photos/{id}.jpg 로 비공개 · JPEG · 덮어쓰지 않음", async () => {
    blob.put.mockResolvedValue({ pathname: `photos/${ID}.jpg` });
    expect(photos.photoStore()).toBe("storage");
    expect(await photos.savePhoto(ID, JPEG)).toEqual({ ok: true });

    expect(blob.put).toHaveBeenCalledTimes(1);
    const [pathname, body, opts] = blob.put.mock.calls[0] as [string, Buffer, Record<string, unknown>];
    expect(pathname).toBe(`photos/${ID}.jpg`);
    expect(Buffer.from(body).equals(JPEG)).toBe(true);
    expect(opts).toMatchObject({ access: "private", contentType: "image/jpeg", addRandomSuffix: false });
    expect(opts.allowOverwrite).toBeUndefined();
    // 서버 폴더에는 쓰지 않는다
    expect(existsSync(path.join(dir, "photos"))).toBe(false);
  });

  it("열쇠(BLOB_READ_WRITE_TOKEN)만 있어도 Blob 으로 간다 (Vercel 밖)", async () => {
    delete process.env.BLOB_STORE_ID;
    process.env.BLOB_READ_WRITE_TOKEN = "vercel_blob_rw_test";
    blob.put.mockResolvedValue({});
    expect(photos.photoStore()).toBe("storage");
    expect(await photos.savePhoto(ID, JPEG)).toEqual({ ok: true });
    expect(blob.put).toHaveBeenCalledTimes(1);
  });

  it("Blob 이 거절하면 502", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    blob.put.mockRejectedValue(new Error("blob down"));
    expect(await photos.savePhoto(ID, JPEG)).toMatchObject({ ok: false, status: 502 });
  });

  it("읽기: photos/{id}.jpg 를 비공개로 꺼낸다", async () => {
    blob.get.mockResolvedValue({ statusCode: 200, stream: new Response(new Uint8Array(JPEG)).body, blob: { contentType: "image/jpeg" } });
    const r = await photos.readPhoto(ID);
    expect(r.ok).toBe(true);
    expect(blob.get).toHaveBeenCalledWith(`photos/${ID}.jpg`, { access: "private" });
    if (r.ok) {
      expect(r.contentType).toBe("image/jpeg");
      expect(Buffer.from(await new Response(r.body).arrayBuffer()).equals(JPEG)).toBe(true);
    }
  });

  it("없는 사진은 404, Blob 장애는 502", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    blob.get.mockResolvedValue(null);
    expect(await photos.readPhoto(ID)).toEqual({ ok: false, status: 404 });
    const { BlobNotFoundError } = await import("@vercel/blob");
    blob.get.mockRejectedValue(new BlobNotFoundError());
    expect(await photos.readPhoto(ID)).toEqual({ ok: false, status: 404 });
    blob.get.mockRejectedValue(new Error("blob down"));
    expect(await photos.readPhoto(ID)).toEqual({ ok: false, status: 502 });
  });

  it("이상한 id 는 Blob 을 부르지 않는다", async () => {
    expect(await photos.readPhoto("../db")).toEqual({ ok: false, status: 404 });
    expect((await photos.savePhoto("../db", JPEG)).ok).toBe(false);
    expect(blob.get).not.toHaveBeenCalled();
    expect(blob.put).not.toHaveBeenCalled();
  });

  it("Vercel 에서도 설정이 있으면 Blob 으로 올린다", async () => {
    process.env.VERCEL = "1";
    vercelDb();
    await load();
    blob.put.mockResolvedValue({});
    expect(photos.photoStore()).toBe("storage");
    expect(await photos.savePhoto(ID, JPEG)).toEqual({ ok: true });
  });
});
