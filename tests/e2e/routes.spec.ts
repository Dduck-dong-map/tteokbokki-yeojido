import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { SAMPLE_LISTS, SAMPLE_POSTS } from "../fixtures/sample-community";
import { SAMPLE_STORES } from "../fixtures/sample-stores";
import { adminLogin, collectErrors } from "./helpers";

// 라우트 전부 × 폭 셋: 200 · 콘솔 오류 0 · 가로 스크롤 0.
// 손으로 쓴 목록 대신 src/app/**/page.tsx 를 훑어 만든다 (11-19: 19개, 어드민 6개 포함).

const APP = path.resolve(__dirname, "../../src/app");

function pageFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) out.push(...pageFiles(full));
    else if (name === "page.tsx") out.push(full);
  }
  return out.sort();
}

// 동적 세그먼트는 시험 자료(tests/fixtures)의 첫 id 로 바꾼다. 어드민 가게 편집(/admin/stores/[id])도 같은 가게 id.
const STORE_ID = SAMPLE_STORES[0].id;
const POST_ID = SAMPLE_POSTS[0].id;
const LIST_ID = SAMPLE_LISTS[0].id;

function toUrl(file: string) {
  const segs = path
    .relative(APP, path.dirname(file))
    .split(path.sep)
    .filter((s) => s && !/^\(.*\)$/.test(s)); // (group) 은 주소에 없다
  const url = segs.map((seg, i) => {
    if (seg === "[gu]") return "mapo";
    if (seg === "[taste]") return "soup";
    if (seg === "[id]") {
      const parent = segs[i - 1];
      if (parent === "room") return POST_ID;
      if (parent === "lists") return LIST_ID;
      return STORE_ID; // store · admin/stores
    }
    return seg;
  });
  return "/" + url.join("/");
}

const ROUTES = pageFiles(APP).map((f) => ({ file: path.relative(APP, f), url: toUrl(f) }));

test("page.tsx 19개를 찾는다 (어드민 6개 포함)", () => {
  expect(ROUTES.map((r) => r.url)).toHaveLength(19);
  expect(new Set(ROUTES.map((r) => r.url)).size).toBe(ROUTES.length);
});

for (const { file, url } of ROUTES) {
  test(`${url}  ←  ${file}`, async ({ page }) => {
    // 어드민 화면은 열쇠로 들어간 뒤에 연다 — 잠김 안내가 아니라 실제 내용의 폭 · 오류를 본다 (로그인 화면은 그대로 연다)
    if (url.startsWith("/admin") && url !== "/admin/login") await adminLogin(page);
    const errors = collectErrors(page);
    const res = await page.goto(url, { waitUntil: "load" });
    expect(res, "응답 없음").not.toBeNull();
    expect(res!.status(), `${url} 상태 코드`).toBe(200);

    // 스트리밍(Suspense)·하이드레이션이 끝나기를 기다린다. 지도 타일이 계속 오면 networkidle 이 안 올 수 있어 상한을 둔다.
    await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => undefined);
    await page.waitForTimeout(500);

    const { scrollWidth, innerWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    expect(scrollWidth, `${url} 가로 스크롤 (scrollWidth ${scrollWidth} > innerWidth ${innerWidth})`).toBeLessThanOrEqual(innerWidth);
    expect(errors, `${url} 콘솔 오류`).toEqual([]);
  });
}
