import { existsSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { chromium, defineConfig, devices } from "@playwright/test";
import { seedDataDir } from "./tests/fixtures/seed";

// 번들 Chromium 이 없으면(예: 이 Playwright 판이 지원하지 않는 macOS 13) 시스템 Google Chrome 으로 돈다.
const browser = existsSync(chromium.executablePath()) ? {} : { channel: "chrome" as const };

// E2E 서버는 3101 에 따로 띄운다. 개발 서버(3100)는 건드리지 않는다.
// 저장소는 파일 모드(DATA_DIR=.data-e2e)로 고정하고, 개발 DB(DATABASE_URL)는 절대 쓰지 않는다 — 계획 9절(Codex 보강) 결정.
const E2E_PORT = 3101;
const E2E_URL = `http://127.0.0.1:${E2E_PORT}`;
// 네이버 키는 비운다: 시험이 네이버 사용량(한도)을 쓰지 않게, 실제 지도 자리는 임시 지도로 (11-13)
// 저장소는 시험 자료(tests/fixtures — 가게 16곳 · 글 · 리스트)로 채운다. 앱은 빈 저장소로 시작하므로 서버를 띄우기 전에 아래에서 써 둔다.
// 운영 열쇠를 넣어 배포와 같은 열쇠 방식으로 돈다 (src/lib/admin/access.ts · F010). 어드민 시험은 helpers.ts 의 adminLogin 으로 들어간다.
// 열쇠가 있으면 운영 모드(next start)에서도 어드민이 열려, 서버 모드가 dev 든 start 든 같은 시험이 돈다
export const E2E_ADMIN_KEY = "e2e-admin-key";
const E2E_ENV = { DATA_DIR: ".data-e2e", PORT: String(E2E_PORT), DATABASE_URL: "", NEXT_PUBLIC_NAVER_MAP_KEY: "", ADMIN_KEY: E2E_ADMIN_KEY };

// Next 16 은 같은 프로젝트에서 `next dev` 를 둘 띄울 수 없다 (experimental.lockDistDir 기본 켜짐 → .next/dev/lock, 두 번째는 exit 1).
// 개발 서버가 살아 있으면 프로덕션 빌드(`next build` + `next start`)로 돌린다 — 번들 문서(02-guides/testing/playwright.md)도 이 방식을 권한다.
// `next build` 는 .next/, `next dev` 는 .next/dev/ 를 써서 서로 부딪히지 않는다.
function devServerAlive() {
  const lock = path.resolve(".next/dev/lock");
  if (!existsSync(lock)) return false;
  try {
    const { pid } = JSON.parse(readFileSync(lock, "utf8")) as { pid?: number };
    if (!pid) return false;
    process.kill(pid, 0); // 신호 0 = 살아 있는지만 본다
    return true;
  } catch {
    return false;
  }
}

const useProd = process.env.E2E_SERVER === "start" || (process.env.E2E_SERVER !== "dev" && devServerAlive());
const command = useProd
  ? `pnpm build && pnpm exec next start -p ${E2E_PORT}`
  : // `next dev` 를 바로 부르면 predev 가 돌지 않아 public/maplibre/ 일꾼 파일이 없다 → 새로 받은 저장소(CI)에서 지도가 안 뜬다 (11-19). 같은 복사를 먼저 한다
    `node scripts/copy-maplibre-worker.mjs && node scripts/copy-share.mjs && DATA_DIR=.data-e2e PORT=${E2E_PORT} pnpm exec next dev -p ${E2E_PORT}`;
// 워커마다 설정을 다시 읽으므로 주 프로세스에서만 한다.
// 서버(특히 next build 의 미리 그리기)가 뜨기 전에 E2E 저장소를 비우고 시험 자료로 채운다 — globalSetup 은 서버가 뜬 뒤에 돈다
if (process.env.TEST_WORKER_INDEX === undefined) {
  rmSync(path.resolve(".data-e2e"), { recursive: true, force: true });
  seedDataDir(path.resolve(".data-e2e"));
}
if (process.env.TEST_WORKER_INDEX === undefined) console.log(`[e2e] 서버 모드: ${useProd ? "next build + next start (개발 서버가 떠 있어 dev 잠금 회피)" : "next dev"} · ${E2E_URL}`);

export default defineConfig({
  testDir: "tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  timeout: 90_000, // 첫 요청 때 컴파일(dev) · 지도 로딩을 감안
  expect: { timeout: 15_000 },
  fullyParallel: true,
  workers: process.env.CI ? 1 : 2,
  retries: 0,
  reporter: [["list"]],
  use: {
    ...browser,
    baseURL: E2E_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  // 폭 셋: 폰(390 · 터치) · 패널형(768) · 3단(1280). 모두 Chromium.
  projects: [
    { name: "mobile-390", use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 } },
    { name: "tablet-768", use: { ...devices["Desktop Chrome"], viewport: { width: 768, height: 1024 } } },
    { name: "desktop-1280", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } } },
  ],
  webServer: {
    command,
    url: E2E_URL,
    reuseExistingServer: false,
    timeout: useProd ? 420_000 : 180_000,
    env: E2E_ENV,
    stdout: "ignore",
    stderr: "pipe",
  },
});
