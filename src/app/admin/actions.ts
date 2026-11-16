"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, adminAccess, checkKey, tokenFor } from "@/lib/admin/access";
import { adminConfirm, adminCreateStore, adminImport, adminSaveStore, adminSetStatus } from "@/lib/data/admin";
import { getDataset } from "@/lib/data/datasets";
import type { StoreStatus } from "@/lib/types";

// 운영 어드민의 저장 (11-15). 화면에서 부르지만 누구나 직접 POST 할 수 있으므로, 매번 권한부터 본다 (Next 문서 「Data Security」).
// 바뀐 가게는 지도·목록·상세에 바로 보이도록 캐시를 비운다.

type Out<T = object> = ({ ok: true } & T) | { ok: false; error: string };
const DENIED = { ok: false as const, error: "운영 권한이 없어요. 운영 로그인을 다시 해 주세요" };

async function allowed() {
  return (await adminAccess()).ok;
}

function done<T extends { ok: boolean }>(res: T) {
  if (res.ok) revalidatePath("/", "layout");
  return res;
}

const failOut = (r: { ok: false; error: string }) => ({ ok: false as const, error: r.error });

export async function saveStore(id: string, input: unknown): Promise<Out<{ changes: number }>> {
  if (!(await allowed())) return DENIED;
  const r = done(await adminSaveStore(String(id), input));
  return r.ok ? r : failOut(r);
}

export async function createStore(input: unknown, wantedId?: string): Promise<Out<{ id: string }>> {
  if (!(await allowed())) return DENIED;
  const r = done(await adminCreateStore(input, typeof wantedId === "string" ? wantedId.trim() : undefined));
  return r.ok ? r : failOut(r);
}

export async function setStoreStatus(id: string, status: StoreStatus, reason?: string): Promise<Out> {
  if (!(await allowed())) return DENIED;
  const r = done(await adminSetStatus(String(id), status, typeof reason === "string" ? reason : undefined));
  return r.ok ? r : failOut(r);
}

export async function confirmStore(id: string): Promise<Out<{ at: string }>> {
  if (!(await allowed())) return DENIED;
  const r = done(await adminConfirm(String(id)));
  return r.ok ? r : failOut(r);
}

// 자료 묶음 넣기. ids 를 주면 그 가게만, 없으면 넣을 수 있는 것 전부
export async function importDataset(datasetId: string, ids?: string[]): Promise<Out<{ added: string[]; skipped: { id: string; why: string }[] }>> {
  if (!(await allowed())) return DENIED;
  const ds = getDataset(String(datasetId));
  if (!ds) return { ok: false, error: "자료 묶음을 찾지 못했어요" };
  const pick = Array.isArray(ids) ? new Set(ids.map(String)) : null;
  const rows = ds.stores.filter((r) => !pick || pick.has(r.id));
  return done(await adminImport(rows, ds.who));
}

// ───────── 로그인 (ADMIN_KEY 가 있을 때만 쓴다) ─────────

export async function adminLogin(_prev: { error?: string } | undefined, form: FormData): Promise<{ error?: string }> {
  const typed = String(form.get("key") ?? "");
  // 열쇠를 마구 넣어 보는 것을 늦춘다
  await new Promise((r) => setTimeout(r, 600));
  if (!checkKey(typed)) return { error: "열쇠가 맞지 않아요" };
  (await cookies()).set(ADMIN_COOKIE, tokenFor(typed), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production" && !!process.env.VERCEL,
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  redirect("/admin/stores");
}

export async function adminLogout() {
  (await cookies()).delete(ADMIN_COOKIE);
  redirect("/admin/login");
}
