import { rmSync } from "node:fs";
import path from "node:path";

// E2E 저장소(.data-e2e)를 매번 비운다 → 예시 데이터로 다시 시작한다.
// Playwright 는 webServer 를 먼저 띄우고 이 함수를 부르지만, 파일 저장소는 요청 때마다 읽으므로 상관없다.
export default function globalSetup() {
  rmSync(path.resolve(".data-e2e"), { recursive: true, force: true });
}
