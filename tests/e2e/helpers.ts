import { randomUUID } from "node:crypto";
import { expect, type APIRequestContext, type BrowserContext, type ConsoleMessage, type Page } from "@playwright/test";

// 가입이 없는 서비스라 「누구」는 기기 표시(localStorage ddy-me → x-ddy-device 헤더)와 접속 위치(IP)로만 가른다.
// 같은 사람(lib/data/db.ts same())은 기기와 IP 가 모두 같을 때만이지만, 테스트끼리 섞이지 않게 둘 다 새로 준다.
// 11-18 결정: 내리는 판정(달라요 · 신고)은 서로 다른 IP 3곳이 모여야 한다. E2E 요청은 모두 127.0.0.1 에서 가므로
// 「서로 다른 3명」은 x-forwarded-for 를 다르게 넣어 흉내 낸다 (someone() · asNewIp() 가 그렇게 한다). 기기 표시가 없는 쓰기는 400 이다.

export const tag = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

// 새 기기로 시작: 화면이 뜨기 전에 localStorage 에 기기 표시와 닉네임을 심는다 (lib/me.ts 가 그대로 읽는다)
export async function asNewDevice(context: BrowserContext, nick = "E2E 손님") {
  const device = randomUUID();
  await context.addInitScript(
    ({ device, nick }) => {
      localStorage.setItem("ddy-me", JSON.stringify({ device, nick }));
    },
    { device, nick },
  );
  return device;
}

// 쓰기 요청에 테스트마다 다른 접속 위치를 붙인다 (lib/request.ts whoFrom 이 x-forwarded-for 를 먼저 읽는다)
export async function asNewIp(page: Page) {
  const ip = `10.${rand(255)}.${rand(255)}.${rand(254) + 1}`;
  await page.route("**/api/**", (route) => route.continue({ headers: { ...route.request().headers(), "x-forwarded-for": ip } }));
  return ip;
}
const rand = (n: number) => Math.floor(Math.random() * n);

// 아주 작은 진짜 JPEG. 브라우저(canvas)로 만들어야 lib/me.ts uploadPhoto 의 createImageBitmap 이 읽는다.
export async function tinyJpeg(page: Page) {
  const dataUrl = await page.evaluate(() => {
    const c = document.createElement("canvas");
    c.width = 16;
    c.height = 16;
    const g = c.getContext("2d")!;
    g.fillStyle = "#c0392b";
    g.fillRect(0, 0, 16, 16);
    return c.toDataURL("image/jpeg", 0.9);
  });
  return Buffer.from(dataUrl.split(",")[1], "base64");
}

// 콘솔 오류 모으기. 지도 타일·스타일 서버(openfreemap)가 안 닿을 때 나는 네트워크 실패는 환경 탓이라 뺀다.
// (TteokMap 은 타일이 안 와도 「지도를 불러오지 못했어요」 안내만 띄우고 주소·길찾기는 그대로 둔다 — 경고창#6)
const ALLOWED = [/tiles\.openfreemap\.org/, /openfreemap\.org/];

export function collectErrors(page: Page) {
  const errors: string[] = [];
  const allowed = (text: string, url?: string) => ALLOWED.some((re) => re.test(text) || (url ? re.test(url) : false));
  page.on("console", (msg: ConsoleMessage) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (allowed(text, msg.location()?.url)) return;
    errors.push(`[console] ${text}`);
  });
  page.on("pageerror", (err) => errors.push(`[pageerror] ${err.message}`));
  return errors;
}

// 폰 폭인지 (useIsWide 와 같은 768 기준)
export const isMobile = (page: Page) => (page.viewportSize()?.width ?? 0) < 768;

// 등록 폼: 폰은 다섯 단계를 「다음」으로 넘기고, 768 이상은 한 화면이라 「다음」이 없다
export async function next(page: Page) {
  if (isMobile(page)) await page.getByRole("button", { name: "다음" }).click();
}

// MapPicker 는 지도가 뜬 뒤 가운데 좌표를 lat/lng 로 알려 준다 → 지도 캔버스가 생기고 한 박자 기다린다
export async function waitMap(page: Page) {
  await page.locator("canvas.maplibregl-canvas").first().waitFor({ timeout: 30_000 });
  await page.waitForTimeout(2_000);
}

// 1~4단계 채우기 (사진 직전까지). name · 위치는 호출한 쪽이 정한다.
export async function fillSteps(page: Page, name: string) {
  await page.locator("#reg-name").fill(name);
  await page.locator("#reg-grade").getByRole("button", { name: "분식집", exact: true }).click();
  await page.locator("#reg-address").fill("서울 마포구 망원동 1-1");
  await next(page);
  // 「밀떡」은 「누들밀떡」과 부분 일치하므로 exact
  await page.locator("#reg-rice").getByRole("button", { name: "밀떡", exact: true }).click();
  await page.locator("#reg-style").getByRole("button", { name: "국물", exact: true }).click();
  await page.locator("#reg-spice").getByRole("button", { name: /신라면/ }).click();
  await next(page);
  await page.locator("#reg-menu").getByLabel("메뉴 이름").first().fill("떡볶이");
  await page.locator("#reg-menu").getByRole("button", { name: "4,000원" }).click();
  await next(page); // → 소개글 (선택)
  await next(page); // → 사진
}

// ───────── 화면 밖에서 미리 쌓아 두기 (API) ─────────
// 신고 3명 · 남이 쓴 글처럼 여러 사람이 필요한 준비는 화면 대신 API 로 한다. 결과 확인은 화면으로 한다.
// 「누구」= x-ddy-device(기기 표시) + x-forwarded-for(접속 위치) — 화면의 lib/me.ts send 와 같은 머리글이다.
export type Someone = { device: string; ip: string; nick: string };
export const someone = (nick = "E2E 준비"): Someone => ({ device: randomUUID(), ip: `10.${rand(255)}.${rand(255)}.${rand(254) + 1}`, nick });

// 같은 접속 위치(와이파이)에서 기기 표시만 다른 n 명 — 헤더만 바꿔 보내는 도배 흉내
export function sameIpPeople(n: number, nick = "E2E 같은 와이파이"): Someone[] {
  const ip = someone().ip;
  return Array.from({ length: n }, () => ({ ...someone(nick), ip }));
}

export async function post<T = { ok: boolean; id?: string; error?: string; status?: string }>(request: APIRequestContext, url: string, body: Record<string, unknown>, who: Someone = someone()) {
  const res = await request.post(url, { data: { ...body, nick: who.nick }, headers: { "x-ddy-device": who.device, "x-forwarded-for": who.ip } });
  const json = (await res.json()) as T & { ok: boolean; error?: string };
  expect(json.ok, `${url} ${JSON.stringify(body)} → ${json.error ?? ""}`).toBe(true);
  return json;
}

// 거절되는 요청을 볼 때: 성공을 기대하지 않고 상태 코드와 본문을 그대로 돌려준다. who 의 device 를 빼면 기기 표시 없이 보낸다
export async function postRaw(request: APIRequestContext, url: string, body: Record<string, unknown>, who: Partial<Someone> = {}) {
  const headers: Record<string, string> = {};
  if (who.device) headers["x-ddy-device"] = who.device;
  if (who.ip) headers["x-forwarded-for"] = who.ip;
  const res = await request.post(url, { data: { ...body, nick: who.nick ?? "E2E" }, headers });
  return { status: res.status(), json: (await res.json()) as { ok: boolean; error?: string; status?: string } };
}

// 시험용 가게 하나 (확인 중 · 사진 없음). 기본은 지도 홈의 첫 화면(마포 · 서대문)과 지역 목록에서 떨어진 서울 북동쪽 끝에 둔다 — 구는 etc.
// 너무 멀리(예: 경기 남쪽 45km) 두면 안 된다: 「가게 N곳 모두 보기」가 예시 가게와 시험 가게를 한 화면에 담으려다
// 지도의 가장 작은 배율(minZoom 10)에 걸려 두 무리 사이 빈 곳을 비추고, F003 「지도 범위 안 0곳」 시험이 실패한다.
export async function addTestStore(request: APIRequestContext, p: Partial<{ name: string; lat: number; lng: number; address: string }> = {}) {
  const res = await post<{ ok: true; id: string }>(request, "/api/stores", {
    name: p.name ?? `E2E 가게 ${tag()}`,
    address: p.address ?? "경기 시험시 시험동 1-1",
    lat: p.lat ?? 37.62 + Math.random() * 0.04,
    lng: p.lng ?? 127.04 + Math.random() * 0.04,
    grade: "bunsik",
    rice: ["wheat"],
    style: "soup",
    spice: 3,
    menu: [{ name: "떡볶이", price: 4000 }],
    photos: [],
    notDuplicate: true,
  });
  return res.id;
}

// 「지도에 올리기」. 위치는 등록 지도가 다 뜬 뒤 가운데 좌표로 정해져서, 서버가 바쁘면 그보다 먼저 누를 수 있다.
// 그때 뜨는 「지도에서 가게 위치를 골라 주세요」는 화면 안 검사라 서버로 가지 않는다 → 조금 뒤 다시 누른다.
// 그 밖의 결과(중복 안내 등)는 기다리는 쪽이 본다: until 이 보이면 멈춘다.
export async function submitRegister(page: Page, until: ReturnType<Page["getByRole"]>) {
  const noPosition = page.getByRole("alert").filter({ hasText: "지도에서 가게 위치를 골라 주세요" });
  await expect(async () => {
    if (!(await until.isVisible())) await page.getByRole("button", { name: "지도에 올리기" }).click();
    await expect(noPosition).toHaveCount(0, { timeout: 2_000 });
    await expect(until).toBeVisible({ timeout: 20_000 });
  }).toPass({ timeout: 60_000 });
}

// 어드민 로그인 (F010). E2E 서버의 운영 열쇠(playwright.config.ts E2E_ENV.ADMIN_KEY)와 같은 값.
// 열쇠를 넣으면 가게 관리로 옮겨 간다. 쿠키는 이 브라우저 컨텍스트에 남는다
export const E2E_ADMIN_KEY = "e2e-admin-key";
export async function adminLogin(page: Page, key = E2E_ADMIN_KEY) {
  await page.goto("/admin/login");
  await page.getByLabel(/운영 열쇠/).fill(key);
  await page.getByRole("button", { name: "들어가기" }).click();
  await page.waitForURL("**/admin/stores");
}
