import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// 요청 하나 안에서 저장소 읽기가 한 번만 도는지 (lib/data/db.ts shared · React.cache, 기술 스택 9절 #6) — 파일 저장소 모드.
// React.cache 는 React 가 서버 화면을 그리는 중에만 기억한다(시험 환경에서는 그냥 부르기만 한다).
// 그래서 react 의 cache 를 「요청 하나」를 흉내 내는 가짜로 바꾼다: newRequest() 전까지는 같은 인자면 같은 결과.
// 저장소 읽기 횟수는 db.json 을 읽는 readFile 부름 수로 센다 (파일이 없을 때도 readFile 은 한 번 불린다).

const scope = vi.hoisted(() => ({ id: 0 }));
vi.mock("react", () => ({
  cache<A extends unknown[], R>(fn: (...args: A) => R) {
    let memo = new Map<string, R>();
    let seen = -1;
    return (...args: A): R => {
      if (seen !== scope.id) {
        memo = new Map();
        seen = scope.id;
      }
      const key = JSON.stringify(args);
      if (!memo.has(key)) memo.set(key, fn(...args));
      return memo.get(key)!;
    };
  },
}));

const reads = vi.hoisted(() => ({ n: 0 }));
vi.mock("node:fs/promises", async (orig) => {
  const fs = await orig<typeof import("node:fs/promises")>();
  return {
    ...fs,
    readFile: (async (...args: Parameters<typeof fs.readFile>) => {
      if (String(args[0]).endsWith("db.json")) reads.n++;
      return fs.readFile(...args);
    }) as typeof fs.readFile,
  };
});

const newRequest = () => {
  scope.id++;
  reads.n = 0;
};

type Data = typeof import("@/lib/data");
type Db = typeof import("@/lib/data/db");
let data: Data;
let db: Db;
let dir: string;

const who = { nick: "손님", device: "device-read-once", ip: "10.9.9.9" };

beforeEach(async () => {
  dir = mkdtempSync(path.join(os.tmpdir(), "ddy-read-once-"));
  process.env.DATA_DIR = dir;
  process.env.DATABASE_URL = "";
  delete (globalThis as { __ddyQueue?: unknown }).__ddyQueue;
  vi.resetModules();
  db = await import("@/lib/data/db");
  data = await import("@/lib/data");
  // 예시 데이터를 파일로 한 번 써 둔다 (이후 읽기가 실제 파일을 읽게)
  await db.addPost({ cat: "free", title: "읽기 시험", body: "본문" }, who);
  newRequest();
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe("요청 하나 = 저장소 읽기 한 번", () => {
  it("지도 홈: 레이아웃 · 페이지가 가게 목록 · 최근 제보 수를 따로 읽어도 한 번", async () => {
    const [a, b] = await Promise.all([data.getStores(), data.getStores()]);
    await data.getRecentReportCount();
    expect(a.length).toBeGreaterThan(0);
    expect(b).toEqual(a);
    expect(reads.n).toBe(1);
  });

  it("가게 상세: 목록 + 가게 + 후기 + 이력을 읽어도 한 번", async () => {
    const stores = await data.getStores();
    const id = stores[0].id;
    await Promise.all([data.getStore(id), data.getReviews(id), data.getHistory(id), data.getStores()]);
    expect(reads.n).toBe(1);
  });

  it("떡볶이방 · 리스트 · 내 것도 같은 읽기를 함께 쓴다", async () => {
    await data.getPosts();
    await data.getPublicLists();
    await db.readOwned(who.device);
    expect(reads.n).toBe(1);
  });

  it("요청이 바뀌면 다시 읽는다 (요청끼리는 나누지 않는다)", async () => {
    await data.getStores();
    newRequest();
    await data.getStores();
    expect(reads.n).toBe(1);
  });
});

describe("같은 요청에서 쓰기 뒤에는 새 값을 읽는다", () => {
  it("글을 쓰면 같은 요청의 다음 읽기에 바로 보인다", async () => {
    const before = await data.getPosts();
    expect(reads.n).toBe(1);
    const res = await db.addPost({ cat: "free", title: "방금 쓴 글", body: "본문" }, who);
    expect(res.ok).toBe(true);
    expect(reads.n).toBe(2); // 쓰기는 늘 새로 읽는다 (기억한 값을 고치지 않는다)
    const after = await data.getPosts();
    expect(reads.n).toBe(3); // 쓰기 세대가 바뀌어 다시 읽음
    expect(after.length).toBe(before.length + 1);
    expect(after.some((p) => p.title === "방금 쓴 글")).toBe(true);
    // 앞서 받은 목록은 그대로다 (함께 보는 값을 쓰기가 고치지 않는다)
    expect(before.some((p) => p.title === "방금 쓴 글")).toBe(false);
  });

  it("쓰기가 실패해도(규칙 거절) 다음 읽기는 새로 한다", async () => {
    await data.getStores();
    const res = await db.deletePost("없는-글", who);
    expect(res.ok).toBe(false);
    await data.getStores();
    expect(reads.n).toBe(3);
  });
});
