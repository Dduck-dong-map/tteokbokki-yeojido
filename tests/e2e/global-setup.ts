import { rmSync } from "node:fs";
import path from "node:path";
import { seedDataDir } from "../fixtures/seed";

// E2E 저장소(.data-e2e)를 매번 비우고 시험 자료(tests/fixtures)로 다시 채운다. 앱은 빈 저장소로 시작한다(11-19).
// Playwright 는 webServer 를 먼저 띄우고 이 함수를 부르지만, 파일 저장소는 요청 때마다 읽으므로 상관없다.
// (서버가 뜨기 전의 첫 채우기는 playwright.config.ts 가 한다 — next build 가 빈 저장소를 미리 그리지 않게)
export default function globalSetup() {
  const dir = path.resolve(".data-e2e");
  rmSync(dir, { recursive: true, force: true });
  seedDataDir(dir);
}
