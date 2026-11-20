import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// 배포 환경 가드 (lib/data/db.ts, 기술 스택 9절 #2). db.ts 를 불러올 때 검사하므로 모듈을 새로 읽어 본다.
// Vercel 에서 DATABASE_URL 이 비면 파일 모드(/tmp)로 써서 저장이 사라진다 → 불러오기가 실패해야(서버가 시작하지 않아야) 한다.

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("HASH_SALT", "test-salt");
  vi.stubEnv("DATA_DIR", "/tmp/ddy-env-guard-unused");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("DATABASE_URL 가드", () => {
  it("VERCEL 이 있고 DATABASE_URL 이 비면 db.ts 를 불러올 때 멈춘다", async () => {
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("DATABASE_URL", "");
    await expect(import("@/lib/data/db")).rejects.toThrow(/DATABASE_URL/);
  });

  it("VERCEL 이 있고 DATABASE_URL 이 있으면 불러온다 (연결은 첫 읽기 때)", async () => {
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("DATABASE_URL", "postgres://u:p@db.example.com:6543/postgres");
    await expect(import("@/lib/data/db")).resolves.toHaveProperty("mutate");
  });

  it("VERCEL 이 없으면(개발 · E2E · 도커 앱) DATABASE_URL 이 비어도 파일 모드로 돈다", async () => {
    vi.stubEnv("VERCEL", "");
    vi.stubEnv("DATABASE_URL", "");
    await expect(import("@/lib/data/db")).resolves.toHaveProperty("mutate");
  });

  it("HASH_SALT 가드는 그대로: VERCEL 에서 비면 멈춘다", async () => {
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("DATABASE_URL", "postgres://u:p@db.example.com:6543/postgres");
    vi.stubEnv("HASH_SALT", "");
    await expect(import("@/lib/data/db")).rejects.toThrow(/HASH_SALT/);
  });
});
