import { randomUUID } from "node:crypto";
import type { BrowserContext, ConsoleMessage, Page } from "@playwright/test";

// 가입이 없는 서비스라 「누구」는 기기 표시(localStorage ddy-me → x-ddy-device 헤더)와 접속 위치(IP)로만 가른다.
// 하루 한도(lib/data/db.ts same())는 기기 OR IP 로 묶이므로, 테스트마다 둘 다 새로 준다.

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
