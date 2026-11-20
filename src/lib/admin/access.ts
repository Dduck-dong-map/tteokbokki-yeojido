import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";

// 운영 어드민에 누가 들어올 수 있나 (11-15). 어드민 화면·저장(app/admin/actions.ts)이 매번 이것을 먼저 본다.
//  - ADMIN_KEY 가 있으면: 로그인 화면에서 그 열쇠를 넣은 브라우저만 (쿠키). 배포(Vercel · Neon)는 반드시 이 방식.
//  - ADMIN_KEY 가 없으면: 이 컴퓨터의 개발 서버에서만 — 배포가 아니고(VERCEL 없음), production 빌드가 아니고(NODE_ENV),
//    DB 가 이 컴퓨터(파일 · 이 컴퓨터의 Postgres)이고, 주소창이 127.0.0.1·localhost 일 때. 같은 와이파이의 폰으로는 열리지 않는다. DATABASE_URL 이 바깥 DB(Neon)면 개발 서버도 열쇠가 필요하다.
//    production(next start · Vercel)은 ADMIN_KEY 가 없으면 늘 잠근다 — Host 헤더는 요청한 쪽이 마음대로 보낼 수 있어서다 (기술 스택 9절 #5).
// 실제 운영 로그인(이메일 링크 + 2단계, REQ-AD-01)을 붙일 때는 이 파일만 바꾼다.

export const ADMIN_COOKIE = "ddy_admin";
const LOCAL_HOST = /^(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/;

const adminKey = () => process.env.ADMIN_KEY || "";
export const tokenFor = (key: string) => createHmac("sha256", key).update("ddy-admin-v1").digest("hex");

function sameText(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

function dbOnThisComputer() {
  const url = process.env.DATABASE_URL;
  if (!url) return true; // 파일 저장소 (.data/db.json)
  try {
    const host = new URL(url).hostname;
    return host === "127.0.0.1" || host === "localhost" || host === "db";
  } catch {
    return false;
  }
}

export type Access = { ok: true; mode: "key" | "local" } | { ok: false; why: "login" | "locked" };

export async function adminAccess(): Promise<Access> {
  const key = adminKey();
  if (key) {
    const got = (await cookies()).get(ADMIN_COOKIE)?.value ?? "";
    return sameText(got, tokenFor(key)) ? { ok: true, mode: "key" } : { ok: false, why: "login" };
  }
  const host = (await headers()).get("host") ?? "";
  const production = process.env.NODE_ENV === "production";
  if (!process.env.VERCEL && !production && dbOnThisComputer() && LOCAL_HOST.test(host)) return { ok: true, mode: "local" };
  return { ok: false, why: "locked" };
}

export const keyMode = () => !!adminKey();
export const checkKey = (typed: string) => !!adminKey() && sameText(tokenFor(typed), tokenFor(adminKey()));
