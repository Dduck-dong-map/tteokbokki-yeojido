import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// 운영 어드민 접근 (lib/admin/access.ts adminAccess, 기술 스택 9절 #5).
// next/headers 의 cookies() · headers() 는 요청 밖에서 못 부르므로 가짜로 바꾼다. 환경 변수는 부를 때마다 읽으므로 vi.stubEnv 로 바꾼다.

const req = vi.hoisted(() => ({ host: "", cookie: "" }));

vi.mock("next/headers", () => ({
  headers: async () => new Headers(req.host ? { host: req.host } : {}),
  cookies: async () => ({ get: (name: string) => (name === "ddy_admin" && req.cookie ? { name, value: req.cookie } : undefined) }),
}));

type Access = typeof import("@/lib/admin/access");
let access: Access;

beforeEach(async () => {
  req.host = "127.0.0.1:3000";
  req.cookie = "";
  vi.stubEnv("ADMIN_KEY", "");
  vi.stubEnv("VERCEL", "");
  vi.stubEnv("DATABASE_URL", "");
  vi.stubEnv("NODE_ENV", "development");
  access = await import("@/lib/admin/access");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("ADMIN_KEY 가 있을 때 — 열쇠 쿠키로만", () => {
  beforeEach(() => {
    vi.stubEnv("ADMIN_KEY", "team-secret-key");
  });

  it("쿠키가 열쇠의 HMAC 과 같으면 열린다 (production · 바깥 Host 여도)", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL", "1");
    req.host = "ddy.example.com";
    req.cookie = access.tokenFor("team-secret-key");
    expect(await access.adminAccess()).toEqual({ ok: true, mode: "key" });
  });

  it("쿠키가 없거나 다른 열쇠로 만든 것이면 로그인으로", async () => {
    expect(await access.adminAccess()).toEqual({ ok: false, why: "login" });
    req.cookie = access.tokenFor("wrong-key");
    expect(await access.adminAccess()).toEqual({ ok: false, why: "login" });
    req.cookie = "abc"; // 길이가 다른 값도 오류 없이 거절
    expect(await access.adminAccess()).toEqual({ ok: false, why: "login" });
  });

  it("열쇠가 있으면 127.0.0.1 개발 서버여도 열쇠 없이는 열리지 않는다", async () => {
    req.host = "127.0.0.1:3000";
    expect(await access.adminAccess()).toEqual({ ok: false, why: "login" });
  });

  it("checkKey: 같은 글자만 맞다", () => {
    expect(access.checkKey("team-secret-key")).toBe(true);
    expect(access.checkKey("team-secret-ke")).toBe(false);
    expect(access.keyMode()).toBe(true);
  });
});

describe("ADMIN_KEY 가 없을 때 — 이 컴퓨터의 개발 서버에서만", () => {
  it("개발(NODE_ENV=development) · VERCEL 없음 · 파일 저장소 · 로컬 Host 면 열린다", async () => {
    for (const host of ["127.0.0.1:3000", "localhost:3101", "[::1]:3000", "localhost"]) {
      req.host = host;
      expect(await access.adminAccess(), host).toEqual({ ok: true, mode: "local" });
    }
    expect(access.keyMode()).toBe(false);
    expect(access.checkKey("")).toBe(false);
  });

  it("이 컴퓨터의 DB(127.0.0.1 · db 호스트)면 열리고, 바깥 DB(Neon)면 잠긴다", async () => {
    vi.stubEnv("DATABASE_URL", "postgres://ddy:ddy_local@127.0.0.1:15432/tteok");
    expect(await access.adminAccess()).toEqual({ ok: true, mode: "local" });
    vi.stubEnv("DATABASE_URL", "postgres://ddy:ddy_local@db:5432/tteok");
    expect(await access.adminAccess()).toEqual({ ok: true, mode: "local" });
    vi.stubEnv("DATABASE_URL", "postgres://app:pw@ep-test-123456-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require");
    expect(await access.adminAccess()).toEqual({ ok: false, why: "locked" });
    vi.stubEnv("DATABASE_URL", "읽을 수 없는 주소");
    expect(await access.adminAccess()).toEqual({ ok: false, why: "locked" });
  });

  it("Host 가 로컬이 아니면(같은 와이파이의 폰 · 도메인) 잠긴다", async () => {
    for (const host of ["192.168.0.10:3000", "ddy.example.com", "localhost.evil.com", ""]) {
      req.host = host;
      expect(await access.adminAccess(), host || "(Host 없음)").toEqual({ ok: false, why: "locked" });
    }
  });

  it("VERCEL 이 있으면 로컬 Host 여도 잠긴다", async () => {
    vi.stubEnv("VERCEL", "1");
    expect(await access.adminAccess()).toEqual({ ok: false, why: "locked" });
  });

  it("production(next start · 도커 앱)이면 VERCEL 이 없고 Host 가 localhost 여도 잠긴다", async () => {
    vi.stubEnv("NODE_ENV", "production");
    for (const host of ["localhost", "127.0.0.1:3000", "localhost:3101"]) {
      req.host = host;
      expect(await access.adminAccess(), host).toEqual({ ok: false, why: "locked" });
    }
    vi.stubEnv("DATABASE_URL", "postgres://ddy:ddy_local@db:5432/tteok"); // 도커 앱 그대로
    expect(await access.adminAccess()).toEqual({ ok: false, why: "locked" });
  });

  it("단위 시험(NODE_ENV=test)은 개발과 같이 다룬다", async () => {
    vi.stubEnv("NODE_ENV", "test");
    expect(await access.adminAccess()).toEqual({ ok: true, mode: "local" });
  });
});
