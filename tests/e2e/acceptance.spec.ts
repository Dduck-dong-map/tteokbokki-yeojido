import { expect, test, type Locator, type Page } from "@playwright/test";
import { SAMPLE_STORES } from "../../src/lib/data/sample-stores";
import { addTestStore, asNewDevice, asNewIp, fillSteps, isMobile, post, postRaw, sameIpPeople, someone, submitRegister, tag, waitMap } from "./helpers";

// PRD 5절 수용 기준 가운데 ROADMAP 1단계 「빠진 E2E 시험」 (F001~F026, F010 · F007 손 확인은 뺌).
// 저장소는 파일 모드(.data-e2e)이고 세 폭이 함께 돈다 → 예시 가게를 내리지 않는다. 내려야 하면 시험용 가게를 새로 만든다(addTestStore).
// 여러 사람이 필요한 준비(신고 3명 · 남의 글)는 API 로 하고, 결과는 화면에서 본다.

const sample = (id: string) => SAMPLE_STORES.find((s) => s.id === id)!;
const project = () => test.info().project.name;

const panel = (page: Page) => page.locator('section[aria-label="가게 목록"]');
const rows = (page: Page) => panel(page).locator('li[id^="row-"]');
const searchBox = (page: Page) => page.getByLabel("가게 검색").filter({ visible: true });

// 목록 줄의 「동 · 거리 · 확인 N일 전」 줄에서 값 꺼내기
const META = 'p:has-text("확인 ")';
function ageDays(text: string) {
  const m = /확인 (오늘|(\d+)(일|주|달) 전)/.exec(text);
  if (!m) throw new Error(`확인 시점을 못 읽음: ${text}`);
  if (m[1] === "오늘") return 0;
  return Number(m[2]) * ({ 일: 1, 주: 7, 달: 30 } as const)[m[3] as "일" | "주" | "달"];
}
function meters(text: string) {
  const m = /· (\d+(?:\.\d+)?)(km|m) ·/.exec(text);
  if (!m) throw new Error(`거리를 못 읽음: ${text}`);
  return Number(m[1]) * (m[2] === "km" ? 1000 : 1);
}
const isSorted = (xs: number[]) => xs.every((x, i) => i === 0 || xs[i - 1] <= x);
async function metaTexts(list: Locator) {
  return list.locator(META).allTextContents();
}

// ───────── F001 떡볶이 지도 ─────────

test("F001 흐린 도장이 지도 범위에 있으면 범례 「흐린 도장 = 반년 넘게 확인 안 됨」", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("흐린 도장 = 반년 넘게 확인 안 됨")).toBeVisible({ timeout: 30_000 });
});

test("F001 지도 타일을 못 받으면 지도 실패 안내, 가게 상세의 주소·길찾기는 그대로", async ({ page }) => {
  await page.route(/openfreemap\.org/, (route) => route.abort());
  await page.goto("/");
  await expect(page.getByText("지도를 불러오지 못했어요. 주소와 길찾기는 그대로 쓸 수 있어요.").first()).toBeVisible({ timeout: 30_000 });

  const s = SAMPLE_STORES[0];
  await page.goto(`/store/${s.id}`);
  await expect(page.getByRole("heading", { level: 1, name: s.name })).toBeVisible();
  await expect(page.getByRole("link", { name: "네이버 지도로 길찾기" })).toBeVisible();
  await expect(page.getByRole("link", { name: "카카오맵" })).toBeVisible();
});

// ───────── F002 취향 필터 ─────────

test("F002 0곳 조합 → 「조건에 맞는 가게가 없어요」 + [필터 초기화] 로 모든 조건이 풀린다", async ({ page }) => {
  // 분모자 + 국물: 예시에도 시험이 올리는 가게(밀떡 · 국물)에도 없는 조합
  await page.goto("/?rice=bunmoja&style=soup&spice=2-4");
  await expect(panel(page).getByRole("heading", { name: "조건에 맞는 가게가 없어요" })).toBeVisible();
  await panel(page).getByRole("button", { name: "필터 초기화" }).click();
  await expect(page).not.toHaveURL(/rice=|style=|spice=/);
  await expect(panel(page).getByRole("heading", { name: /찾은 가게 \d+곳|이 지도 안에는 가게가 없어요/ })).toBeVisible();
  await expect(rows(page).first()).toBeVisible();
});

// ───────── F003 주변 가게 목록 ─────────

test("F003 위치 허용 → 가까운순, 「최근 확인순」을 누르면 마지막 확인일 순", async ({ page, context }) => {
  const near = sample("mangwon-soup");
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({ latitude: near.lat, longitude: near.lng });
  await page.goto("/");
  await expect(panel(page).getByRole("button", { name: "가까운순" })).toHaveAttribute("aria-pressed", "true");
  await expect(rows(page).first()).toBeVisible();
  await expect.poll(async () => (await metaTexts(rows(page))).length).toBeGreaterThan(1);
  const dists = (await metaTexts(rows(page))).map(meters);
  expect(isSorted(dists), `가까운순 거리 ${dists.join(",")}`).toBe(true);

  await panel(page).getByRole("button", { name: "최근 확인순" }).click();
  await expect(panel(page).getByRole("button", { name: "최근 확인순" })).toHaveAttribute("aria-pressed", "true");
  const ages = (await metaTexts(rows(page))).map(ageDays);
  expect(isSorted(ages), `최근 확인순 ${ages.join(",")}`).toBe(true);
});

test("F003 위치 없음 → 최근 확인순 (가까운순은 못 누름)", async ({ page }) => {
  await page.goto("/");
  await expect(panel(page).getByRole("button", { name: "최근 확인순" })).toHaveAttribute("aria-pressed", "true");
  await expect(panel(page).getByRole("button", { name: "가까운순" })).toBeDisabled();
  await expect(rows(page).first()).toBeVisible();
  const ages = (await metaTexts(rows(page))).map(ageDays);
  expect(isSorted(ages), `최근 확인순 ${ages.join(",")}`).toBe(true);
});

test("F003 폭 390 은 줄을 두 번 눌러 상세, 768 이상은 한 번에 상세", async ({ page }) => {
  await page.goto("/");
  const first = rows(page).first();
  await expect(first).toBeVisible();
  const id = (await first.getAttribute("id"))!.replace(/^row-/, "");
  const button = first.locator("button").first();
  await button.click();
  if (isMobile(page)) {
    await expect(button).toHaveAttribute("aria-current", "true");
    await expect(page).toHaveURL(/\/(\?.*)?$/);
    await button.click();
  }
  await expect(page).toHaveURL(new RegExp(`/store/${id}(\\?.*)?$`));
});

test("F003 지도 범위 안 0곳 → 「이 지도 안에는 가게가 없어요」 + [가게 N곳 모두 보기]", async ({ page, context }) => {
  // 내 위치를 가게가 없는 곳(제주)으로 두면 지도가 그리로 간다 (폰은 들어오자마자, 768 이상은 이미 허용한 기기라 조용히)
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({ latitude: 33.4507, longitude: 126.5707 });
  await page.goto("/");
  await expect(panel(page).getByRole("heading", { name: "이 지도 안에는 가게가 없어요" })).toBeVisible({ timeout: 30_000 });
  const all = panel(page).getByRole("button", { name: /가게 \d+곳 모두 보기/ });
  const n = Number(/(\d+)곳/.exec((await all.textContent()) ?? "")![1]);
  expect(n).toBeGreaterThan(0);
  await all.click();
  // 다른 시험이 같은 시간에 가게를 더하거나 내리므로 곳 수가 n 과 꼭 같지는 않다 → 빈 안내가 사라지고 1곳 이상 보이는지만 본다
  const found = panel(page).getByRole("heading", { name: /현재 지도에서 찾은 가게 [1-9]\d*곳/ });
  await expect(found).toBeVisible({ timeout: 20_000 });
  await expect(panel(page).getByRole("heading", { name: "이 지도 안에는 가게가 없어요" })).toHaveCount(0);
});

// ───────── F004 지역·취향 목록 ─────────

test("F004 가게 0곳인 구 칩에 「0곳」, 누르면 「아직 등록된 가게가 없어요. 아는 집을 등록해 주세요!」", async ({ page }) => {
  // PRD 예시는 서대문구지만 E2E 예시 데이터에는 서대문구 가게가 있다 → 0곳인 강남구로 본다
  await page.goto("/list");
  const chip = page.getByRole("navigation", { name: "동네" }).getByRole("link", { name: "강남구 0곳" });
  await expect(chip).toBeVisible();
  await chip.click();
  await expect(page).toHaveURL(/\/seoul\/gangnam$/);
  await expect(page.getByText("아직 등록된 가게가 없어요. 아는 집을 등록해 주세요!")).toBeVisible();
});

test("F004 마포구 × 쌀떡 목록: 지도 없이 쌀떡 가게가 최근 확인순, 누르면 상세", async ({ page }) => {
  await page.goto("/seoul/mapo/rice");
  await expect(page.getByRole("heading", { level: 1, name: /마포구 쌀떡볶이/ })).toBeVisible();
  await expect(page.locator("canvas.maplibregl-canvas")).toHaveCount(0);
  const cards = page.locator("li").filter({ has: page.locator('a[href^="/store/"]') });
  await expect(cards.first()).toBeVisible();
  const ages = (await metaTexts(cards)).map(ageDays);
  expect(isSorted(ages), `확인 시점 ${ages.join(",")}`).toBe(true);
  for (const c of await cards.all()) await expect(c.getByText("쌀떡", { exact: true })).toBeVisible();
  const href = await cards.first().locator("a").getAttribute("href");
  await cards.first().locator("a").click();
  await expect(page).toHaveURL(new RegExp(`${href}$`));
});

// ───────── F005 가게 상세 ─────────

test("F005 폭 390: 작은 지도 위를 세로로 밀면 페이지가 스크롤되고, 누르면 지도 홈이 그 가게로", async ({ page }) => {
  test.skip(project() !== "mobile-390", "폰 폭만");
  const s = sample("hapjeong-rose");
  await page.goto(`/store/${s.id}`);
  const mini = page.getByRole("link", { name: `${s.name} 지도 크게 보기` });
  await expect(mini).toBeVisible();
  const box = (await mini.boundingBox())!;
  const before = await page.evaluate(() => window.scrollY);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Input.synthesizeScrollGesture", { x: box.x + box.width / 2, y: box.y + box.height / 2, yDistance: -300, gestureSourceType: "touch", speed: 800 });
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(before + 100);

  await mini.tap();
  await expect(page).toHaveURL(new RegExp(`/\\?store=${s.id}$`));
  await expect(page.locator(`#row-${s.id} > button`)).toHaveAttribute("aria-current", "true");
});

test("F005 폭 1280: 상세 링크로 바로 들어오면 목록 + 상세 + 큰 지도, 그 가게가 골라져 있다", async ({ page }) => {
  test.skip(project() !== "desktop-1280", "3단 폭만");
  const s = sample("seogyo-hell");
  await page.goto(`/store/${s.id}`);
  await expect(page.getByRole("heading", { level: 1, name: s.name })).toBeVisible();
  await expect(panel(page)).toBeVisible();
  await expect(page.locator("canvas.maplibregl-canvas").first()).toBeVisible({ timeout: 30_000 });
  // 큰 지도가 그 가게 중심(16배)으로 열려 그 가게가 범위 안 목록에 있고 골라져 있다
  await expect(page.locator(`#row-${s.id} > button`)).toHaveAttribute("aria-current", "true");
});

test("F005 없는 가게 주소 → 없는 가게 안내 + [지도로]", async ({ page }) => {
  await page.goto("/store/no-such-store");
  await expect(page.getByRole("heading", { name: "찾으시는 곳이 지도에 없어요" })).toBeVisible();
  await page.getByRole("link", { name: "지도로 가기" }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("F005 신고 3명으로 문 닫은 가게: 맨 위 안내, 내 리스트에 담기 · 맞아요 칸 없음", async ({ page, request }) => {
  const id = await addTestStore(request);
  for (let i = 0; i < 3; i++) await post(request, `/api/stores/${id}`, { action: "flag", reason: "closed" });
  await page.goto(`/store/${id}`);
  await expect(page.getByText("문을 닫았다는 신고가 쌓여 지도에서 내렸어요.")).toBeVisible();
  await expect(page.getByRole("button", { name: /내 리스트에 담기/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "맞아요" })).toHaveCount(0);
});

test("F005 광고 신고 3명으로 숨긴 가게: 「신고가 쌓여 지도에서 내렸어요.」", async ({ page, request }) => {
  const id = await addTestStore(request);
  for (let i = 0; i < 3; i++) await post(request, `/api/stores/${id}`, { action: "flag", reason: "ad" });
  await page.goto(`/store/${id}`);
  await expect(page.getByText("신고가 쌓여 지도에서 내렸어요.", { exact: true })).toBeVisible();
});

// ───────── F006 아직 있어요 ─────────

const lastConfirmed = (page: Page) => page.getByText("마지막 확인", { exact: true }).locator("xpath=following-sibling::p");

test("F006 가게에서 150m → 「확인 고마워요!」, 마지막 확인이 오늘", async ({ page, context }) => {
  await asNewDevice(context);
  await asNewIp(page);
  const s = sample("yeonhui-gimbap");
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({ latitude: s.lat + 0.00135, longitude: s.lng }); // 약 150m 북쪽
  await page.goto(`/store/${s.id}`);
  await page.getByRole("button", { name: "아직 있어요" }).click();
  await expect(page.getByText("확인 고마워요!")).toBeVisible();
  await expect(lastConfirmed(page)).toHaveText("오늘");
});

test("F006 가게에서 500m → 「가게 근처 200m 안에서만 누를 수 있어요」, 확인일 그대로", async ({ page, context }) => {
  await asNewDevice(context);
  await asNewIp(page);
  const s = sample("gongdeok-royal");
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({ latitude: s.lat + 0.0045, longitude: s.lng }); // 약 500m 북쪽
  await page.goto(`/store/${s.id}`);
  const before = await lastConfirmed(page).textContent();
  await page.getByRole("button", { name: "아직 있어요" }).click();
  await expect(page.getByText("가게 근처 200m 안에서만 누를 수 있어요")).toBeVisible();
  await expect(lastConfirmed(page)).toHaveText(before!);
});

test("F006 위치 권한 거절 → 「위치를 허용해야 누를 수 있어요」, 확인일 그대로", async ({ page, context }) => {
  await asNewDevice(context);
  await asNewIp(page);
  await context.clearPermissions();
  const s = sample("ewha-rose");
  await page.goto(`/store/${s.id}`);
  const before = await lastConfirmed(page).textContent();
  await page.getByRole("button", { name: "아직 있어요" }).click();
  await expect(page.getByText("위치를 허용해야 누를 수 있어요")).toBeVisible();
  await expect(lastConfirmed(page)).toHaveText(before!);
});

// ───────── F016 가게 등록 (사진 0장) ─────────

test("F016 사진 0장으로 올리기 → 「지도에 올렸어요」, 상세·목록에 「확인 중」", async ({ page, context }) => {
  await asNewDevice(context);
  await asNewIp(page);
  const name = `E2E 사진없음 ${tag()}`;
  await page.goto("/register");
  await waitMap(page);
  await fillSteps(page, name);
  await submitRegister(page, page.getByRole("heading", { name: /지도에 올렸어요/ }));
  await page.getByRole("link", { name: "올린 가게 보기" }).click();
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name }).locator("xpath=..").getByText("확인 중", { exact: true })).toBeVisible();

  await page.goto("/");
  await searchBox(page).fill(name);
  const row = rows(page).filter({ hasText: name });
  await expect(row).toHaveCount(1);
  await expect(row.getByText("확인 중", { exact: true })).toBeVisible();
});

// ───────── F017 달라요 · F019 신고 — 같은 사람 판정 (11-18) ─────────
// 내리는 판정은 서로 다른 접속 위치(IP) 3곳. E2E 요청은 모두 127.0.0.1 이라 x-forwarded-for 로 서로 다른 곳을 흉내 낸다 (helpers someone · sameIpPeople).

test("F019 같은 접속 위치에서 기기만 바꾼 신고 3건으로는 내려가지 않고, 다른 두 곳이 더 신고하면 내려간다", async ({ page, request }) => {
  const id = await addTestStore(request);
  for (const who of sameIpPeople(3)) await post(request, `/api/stores/${id}`, { action: "flag", reason: "closed" }, who);
  await page.goto(`/store/${id}`);
  await expect(page.getByRole("link", { name: "네이버 지도로 길찾기" })).toBeVisible();
  await expect(page.getByText("문을 닫았다는 신고가 쌓여 지도에서 내렸어요.")).toHaveCount(0);

  await post(request, `/api/stores/${id}`, { action: "flag", reason: "closed" });
  const third = await post(request, `/api/stores/${id}`, { action: "flag", reason: "closed" });
  expect(third.status).toBe("closed");
  await page.reload();
  await expect(page.getByText("문을 닫았다는 신고가 쌓여 지도에서 내렸어요.")).toBeVisible();
});

test("F017 같은 접속 위치의 달라요 3표로는 내려가지 않고, 서로 다른 3곳이면 「사실과 다르다는 의견이 쌓여 지도에서 내렸어요.」", async ({ page, request }) => {
  const id = await addTestStore(request);
  for (const who of sameIpPeople(3)) await post(request, `/api/stores/${id}`, { action: "verify", ok: false }, who);
  await page.goto(`/store/${id}`);
  await expect(page.getByRole("button", { name: "맞아요" })).toBeVisible();
  await expect(page.getByText("사실과 다르다는 의견이 쌓여 지도에서 내렸어요.")).toHaveCount(0);

  await post(request, `/api/stores/${id}`, { action: "verify", ok: false });
  const third = await post(request, `/api/stores/${id}`, { action: "verify", ok: false });
  expect(third.status).toBe("hidden");
  await page.reload();
  await expect(page.getByText("사실과 다르다는 의견이 쌓여 지도에서 내렸어요.")).toBeVisible();
});

test("F017 같은 접속 위치(와이파이)의 세 기기가 맞아요를 누르면 확인이 끝난다", async ({ page, request }) => {
  const id = await addTestStore(request);
  for (const who of sameIpPeople(3)) await post(request, `/api/stores/${id}`, { action: "verify", ok: true }, who);
  await page.goto(`/store/${id}`);
  await expect(page.getByRole("link", { name: "네이버 지도로 길찾기" })).toBeVisible();
  await expect(page.getByRole("button", { name: "맞아요" })).toHaveCount(0);
  const late = await postRaw(request, `/api/stores/${id}`, { action: "verify", ok: true }, someone());
  expect(late).toMatchObject({ status: 409, json: { ok: false, error: "이미 확인이 끝난 가게예요" } });
});

test("기기 표시(x-ddy-device) 없이 보낸 쓰기는 400 으로 거절되고 저장되지 않는다", async ({ page, request }) => {
  const id = await addTestStore(request);
  const msg = "이 브라우저를 알아보는 표시가 함께 오지 않았어요. 화면을 새로 고친 뒤 다시 해 주세요";
  for (let i = 0; i < 3; i++) {
    const res = await postRaw(request, `/api/stores/${id}`, { action: "flag", reason: "closed" }, { ip: someone().ip });
    expect(res).toMatchObject({ status: 400, json: { ok: false, error: msg } });
  }
  expect(await postRaw(request, "/api/room", { action: "post", cat: "free", title: `E2E 헤더 없음 ${tag()}`, body: "본문" })).toMatchObject({ status: 400 });
  expect(await postRaw(request, "/api/lists", { title: `E2E 헤더 없음 ${tag()}`, visibility: "public" })).toMatchObject({ status: 400 });
  // 서로 다른 세 곳에서 보냈어도 받지 않았으므로 가게는 그대로 있다
  await page.goto(`/store/${id}`);
  await expect(page.getByRole("link", { name: "네이버 지도로 길찾기" })).toBeVisible();
  await expect(page.getByText("문을 닫았다는 신고가 쌓여 지도에서 내렸어요.")).toHaveCount(0);
});

// ───────── F021 가게 검색 ─────────

test("F021 맞는 가게 없음 → 빈 안내 + [검색어 지우기] 로 검색이 풀린다", async ({ page }) => {
  await page.goto("/");
  await searchBox(page).fill(`없는가게${tag()}`);
  await expect(panel(page).getByRole("heading", { name: "조건에 맞는 가게가 없어요" })).toBeVisible();
  await panel(page).getByRole("button", { name: "검색어 지우기" }).click();
  await expect(searchBox(page)).toHaveValue("");
  await expect(rows(page).first()).toBeVisible();
});

// ───────── F023 운영 기록 ─────────

test("F023 기록 0건 → 빈 안내 (가게 하나만 거른 운영 기록)", async ({ page }) => {
  // 예시 데이터에는 기록이 늘 있어 전체 0건은 만들 수 없다 → 기록 없는 가게로 거른 화면(?store=)으로 같은 빈 안내를 본다
  await page.goto("/admin/logs");
  await expect(page.locator("table tbody tr").first()).toBeVisible();
  await page.goto("/admin/logs?store=no-such-store");
  await expect(page.getByText("아직 남은 기록이 없어요")).toBeVisible();
  await expect(page.locator("table")).toHaveCount(0);
});

// ───────── F024 찜 ─────────

test("F024 ♡ → 「찜했어요 · 내 맛지도 「찜한 가게」에 있어요」, 찜한 가게 탭에 있고 다른 브라우저는 비어 있다", async ({ page, context, browser }) => {
  await asNewDevice(context);
  const s = sample("hapjeong-rose");
  await page.goto(`/store/${s.id}`);
  const save = page.getByRole("button", { name: `${s.name} 찜하기` });
  await expect(save).toBeVisible();
  // 토스트는 1.4초만 떠 있다 → 누르기 전부터 기다린다
  const toast = expect(page.getByRole("status").filter({ hasText: "찜했어요 · 내 맛지도 「찜한 가게」에 있어요" })).toBeVisible();
  await save.click();
  await toast;
  await page.goto("/mine?tab=saved");
  await expect(page.getByRole("region", { name: "찜한 가게" }).getByRole("heading", { name: s.name })).toBeVisible();

  const other = await browser.newContext({ viewport: page.viewportSize() ?? undefined });
  const otherPage = await other.newPage();
  await otherPage.goto("/mine?tab=saved");
  await expect(otherPage.getByText(/찜한 가게 0곳/)).toBeVisible();
  await otherPage.goto("/mine?tab=reports");
  await expect(otherPage.getByText("아직 올린 가게가 없어요.")).toBeVisible();
  await other.close();
});

// ───────── F025 맛집 리스트 ─────────

test("F025 「링크로만 공유」 리스트는 링크로 열리지만 「모두의 리스트」에는 없다", async ({ page, context, request }) => {
  await asNewDevice(context);
  const maker = someone("리스트 만든 손님");
  const s = SAMPLE_STORES[2];
  const hiddenTitle = `E2E 링크만 ${tag()}`;
  const publicTitle = `E2E 공개 ${tag()}`;
  const link = await post(request, "/api/lists", { title: hiddenTitle, visibility: "link", storeIds: [s.id] }, maker);
  await post(request, "/api/lists", { title: publicTitle, visibility: "public", storeIds: [s.id] }, maker);

  await page.goto(`/lists/${link.id}`);
  await expect(page.getByRole("heading", { level: 1, name: hiddenTitle })).toBeVisible();
  await expect(page.locator("ol").getByText(s.name)).toBeVisible();

  await page.goto("/mine?tab=all");
  await expect(page.getByText(publicTitle)).toBeVisible();
  await expect(page.getByText(hiddenTitle)).toHaveCount(0);
});

test("F025 내 리스트는 추천할 수 없다 (「내 리스트는 추천할 수 없어요」)", async ({ page, context, request }) => {
  const device = await asNewDevice(context);
  const me = { ...someone("리스트 주인"), device };
  const title = `E2E 내 리스트 ${tag()}`;
  const list = await post(request, "/api/lists", { title, visibility: "public" }, me);
  await page.goto(`/lists/${list.id}`);
  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
  const like = page.getByTitle("내 리스트는 추천할 수 없어요");
  await expect(like).toBeVisible();
  await expect(like).toBeDisabled();
});

// ───────── F026 떡볶이방 ─────────

test("F026 서로 다른 3명이 글을 신고하면 글이 가려진다", async ({ page, context, request }) => {
  await asNewDevice(context, "세 번째 신고");
  await asNewIp(page);
  const title = `E2E 신고될 글 ${tag()}`;
  const p = await post(request, "/api/room", { action: "post", cat: "free", title, body: "신고 시험 본문" }, someone("글쓴이"));
  // 같은 접속 위치에서 기기만 바꾼 신고는 몇 건이든 한 곳 몫이다 → 3건을 보내도 글은 그대로 (11-18)
  for (const who of sameIpPeople(3)) await post(request, "/api/room", { action: "flag", id: p.id }, who);
  // 다른 한 곳이 더 신고(두 곳) → 화면의 신고가 세 번째 곳
  await post(request, "/api/room", { action: "flag", id: p.id });

  await page.goto(`/room/${p.id}`);
  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
  await page.getByRole("button", { name: "신고", exact: true }).click();
  await expect(page.getByText("신고했어요. 여러 명이 신고하면 글이 가려져요")).toBeVisible();

  await page.reload();
  await expect(page.getByRole("heading", { name: "찾으시는 곳이 지도에 없어요" })).toBeVisible();
  await page.goto("/room");
  await expect(page.getByText(title)).toHaveCount(0);
});

test("F026 서로 다른 3명이 댓글을 신고하면 댓글이 가려지고 댓글 수가 줄어든다", async ({ page, context, request }) => {
  await asNewDevice(context, "세 번째 신고");
  await asNewIp(page);
  const writer = someone("글쓴이");
  const p = await post(request, "/api/room", { action: "post", cat: "free", title: `E2E 댓글 신고 ${tag()}`, body: "본문" }, writer);
  const text = `E2E 가려질 댓글 ${tag()}`;
  const c = await post(request, "/api/room", { action: "comment", id: p.id, text }, writer);
  // 같은 접속 위치의 3건(한 곳 몫) + 다른 한 곳 = 두 곳 → 댓글은 아직 보이고, 화면의 신고가 세 번째 곳 (11-18)
  for (const who of sameIpPeople(3)) await post(request, "/api/room", { action: "flag-comment", id: c.id }, who);
  await post(request, "/api/room", { action: "flag-comment", id: c.id });

  await page.goto(`/room/${p.id}`);
  await expect(page.getByRole("heading", { name: "댓글 1" })).toBeVisible();
  await page.locator("li").filter({ hasText: text }).getByRole("button", { name: "신고" }).click();
  await expect(page.getByText(text)).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "댓글 0" })).toBeVisible();
});

test("F026 이 기기에서 쓴 댓글은 지우기를 누르면 지워진다", async ({ page, context, request }) => {
  const device = await asNewDevice(context, "댓글 쓴 손님");
  await asNewIp(page);
  const p = await post(request, "/api/room", { action: "post", cat: "together", title: `E2E 댓글 지우기 ${tag()}`, body: "본문" }, someone("글쓴이"));
  const text = `E2E 지울 댓글 ${tag()}`;
  await post(request, "/api/room", { action: "comment", id: p.id, text }, { ...someone("댓글 쓴 손님"), device });

  await page.goto(`/room/${p.id}`);
  await expect(page.getByRole("heading", { name: "댓글 1" })).toBeVisible();
  // 내 댓글인지는 /api/me 를 받은 뒤에 안다 → 「지우기」로 바뀔 때까지 기다린다
  const remove = page.locator("li").filter({ hasText: text }).getByRole("button", { name: "지우기" });
  await expect(remove).toBeVisible();
  await remove.click();
  await expect(page.getByText(text)).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "댓글 0" })).toBeVisible();
});
