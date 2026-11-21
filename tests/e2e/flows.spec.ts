import { expect, test, type Page } from "@playwright/test";
import { SAMPLE_STORES } from "../fixtures/sample-stores";
import { asNewDevice, asNewIp, fillSteps, submitRegister, tag, tinyJpeg, waitMap } from "./helpers";

// 저장 흐름 다섯 (계획 7-3 회귀 계약). 파일 저장소(.data-e2e)에 쓰고, 테스트마다 새 기기·새 접속 위치로 시작한다.
// 셀렉터는 화면 코드(components/register, store, room, lists, mine)에서 읽은 id · role · 문구다.

const SAMPLE = SAMPLE_STORES[0]; // 망원 할머니 국물떡볶이 (예시)

async function addPhoto(page: Page) {
  const jpeg = await tinyJpeg(page);
  await page.locator("#reg-photos input[type=file]").setInputFiles({ name: "sign.jpg", mimeType: "image/jpeg", buffer: jpeg });
  await expect(page.locator("#reg-photos img[alt='올린 사진']")).toHaveCount(1, { timeout: 20_000 });
}

test("① 등록 다섯 단계 끝까지 → /store/[id] 에 이름이 보인다", async ({ page, context }) => {
  await asNewDevice(context);
  await asNewIp(page);
  const name = `E2E 등록 ${tag()}`;

  await page.goto("/register");
  await waitMap(page);
  await fillSteps(page, name);
  await addPhoto(page);

  await submitRegister(page, page.getByRole("heading", { name: /지도에 올렸어요/ }));
  await page.getByRole("link", { name: "올린 가게 보기" }).click();
  await expect(page).toHaveURL(/\/store\/s-[0-9a-f]{8}$/);
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
});

test("② 80m 안 같은 이름 → 「이미 지도에 있는 가게 같아요」 + 그 가게 보기 / 다른 가게예요", async ({ page, context }) => {
  await asNewDevice(context);
  await asNewIp(page);
  // 「내 위치로」를 누르면 지도가 그 자리로 가고, 가운데 핀 좌표가 예시 가게 위가 된다
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({ latitude: SAMPLE.lat, longitude: SAMPLE.lng });

  await page.goto("/register");
  await waitMap(page);
  await page.getByRole("button", { name: "내 위치로" }).click();
  await page.waitForTimeout(1_500); // easeTo 600ms + moveend
  await fillSteps(page, SAMPLE.name);
  await addPhoto(page);

  // Next 의 라우트 안내(#__next-route-announcer__)도 role=alert 라 문구로 거른다
  const alert = page.getByRole("alert").filter({ hasText: "이미 지도에 있는 가게 같아요" });
  await submitRegister(page, alert);
  await expect(alert).toContainText(SAMPLE.name);
  await expect(alert.getByRole("link", { name: "그 가게 보기" })).toHaveAttribute("href", `/store/${SAMPLE.id}`);
  await expect(alert.getByRole("button", { name: "다른 가게예요" })).toBeVisible();
});

test("③ 고치기 저장 → /history 에 한 줄", async ({ page, context }) => {
  await asNewDevice(context, "고치는 손님");
  await asNewIp(page);
  const store = SAMPLE_STORES[1];
  const memo = `E2E 소개글 ${tag()}`;

  await page.goto(`/store/${store.id}/edit`);
  await page.locator("#edit-intro").fill(memo);
  await page.getByRole("button", { name: "고친 내용 올리기" }).click();
  await expect(page).toHaveURL(new RegExp(`/store/${store.id}$`), { timeout: 20_000 });

  await page.goto(`/store/${store.id}/history`);
  await expect(page.getByText("정보를 고쳤어요").first()).toBeVisible();
  await expect(page.getByText(memo)).toBeVisible(); // 소개글 변경 줄: 「소개글 이전 → 새 글」
  await expect(page.getByText("고치는 손님").first()).toBeVisible();
});

test("④ 글 쓰기 → 댓글 → (다른 기기가) 추천", async ({ page, context, browser }) => {
  await asNewDevice(context, "글쓴 손님");
  await asNewIp(page);
  const title = `E2E 글 ${tag()}`;

  await page.goto("/room/write");
  await page.getByRole("button", { name: "맛집 추천" }).click();
  await page.locator("#post-title").fill(title);
  await page.locator("#post-body").fill("E2E 로 올린 본문이에요.");
  await page.getByRole("button", { name: "올리기" }).click();
  await expect(page).toHaveURL(/\/room\/p-[0-9a-f]{8}$/, { timeout: 20_000 });
  // BackHeader 도 h1(「떡볶이방」)이라 이름으로 고른다
  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();

  // 댓글
  await page.locator("#comment-text").fill("E2E 댓글이에요");
  await page.getByRole("button", { name: "댓글 달기" }).click();
  await expect(page.getByText("E2E 댓글이에요")).toBeVisible();
  await expect(page.getByRole("heading", { name: "댓글 1" })).toBeVisible();

  // 추천: 내 글은 추천할 수 없으므로 다른 기기(새 컨텍스트)로 연다
  const other = await browser.newContext({ viewport: page.viewportSize() ?? undefined });
  await asNewDevice(other, "읽는 손님");
  const otherPage = await other.newPage();
  await asNewIp(otherPage);
  await otherPage.goto(page.url());
  const like = otherPage.getByTitle("이 글 추천하기");
  await expect(like).toBeEnabled();
  await like.click();
  await expect(otherPage.getByTitle("추천 취소")).toContainText("1");
  await other.close();
});

test("④-2 글에 사진 붙이기 → 글 화면에 사진이 보인다 (11-21)", async ({ page, context }) => {
  await asNewDevice(context, "사진 손님");
  await asNewIp(page);
  const title = `E2E 사진 글 ${tag()}`;

  await page.goto("/room/write");
  await page.locator("#post-title").fill(title);
  await page.locator("#post-body").fill("사진 붙인 본문이에요.");
  const jpeg = await tinyJpeg(page);
  await page.locator("#post-photos input[type=file]").setInputFiles({ name: "tteok.jpg", mimeType: "image/jpeg", buffer: jpeg });
  await expect(page.locator("#post-photos img[alt='올린 사진']")).toHaveCount(1, { timeout: 20_000 });
  await page.getByRole("button", { name: "올리기" }).click();
  await expect(page).toHaveURL(/\/room\/p-[0-9a-f]{8}$/, { timeout: 20_000 });

  const photo = page.getByRole("img", { name: `${title} 사진 1` });
  await expect(photo).toBeVisible();
  // 사진이 실제로 내려왔다 (깨진 그림이 아니다)
  await expect.poll(() => photo.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0), { timeout: 15_000 }).toBe(true);
});

test("⑤ 내 맛지도에서 리스트 만들기 → 가게 넣기", async ({ page, context }) => {
  await asNewDevice(context, "리스트 손님");
  await asNewIp(page);
  const title = `E2E 리스트 ${tag()}`;

  await page.goto("/mine");
  await page.getByRole("button", { name: /새 리스트 만들기/ }).click();
  await page.locator("#list-title").fill(title);
  await page.getByRole("button", { name: "만들기", exact: true }).click();
  await expect(page).toHaveURL(/\/lists\/l-[0-9a-f]{8}$/, { timeout: 20_000 });
  // BackHeader 도 h1(「맛집 리스트」)이라 이름으로 고른다
  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();

  // 가게 넣기 칸은 만든 기기에서만 보인다 (/api/me 로 확인한 뒤 나타난다)
  const picker = page.getByLabel("가게 이름이나 동네로 찾기");
  await expect(picker).toBeVisible();
  await picker.fill("망원 할머니");
  await page.getByRole("button", { name: SAMPLE.name }).click();
  // 머리글 「○○ 님의 리스트 · 1곳 · 방금 고침」 (가게 줄의 이름은 768 폭에서 폭 0 으로 접히는 버그가 있어 여기서 잡힌다 — 2026-11-09 보고)
  await expect(page.locator("header").getByText(/님의 리스트 · 1곳 ·/)).toBeVisible();
  await expect(page.locator("ol").getByText(SAMPLE.name)).toBeVisible();
});
