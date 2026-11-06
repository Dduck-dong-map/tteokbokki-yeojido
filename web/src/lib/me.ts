"use client";

import { useSyncExternalStore } from "react";

// 가입 없이 쓰는 「나」: 이 기기에만 두는 표시 + 자동으로 지어 주는 닉네임.
// 계정이 생기면(2차) 이 파일 안만 바꾼다.

type Me = { device: string; nick: string };

const KEY = "ddy-me";
const EVENT = "ddy-me-change";
const FEEL = ["매콤한", "쫀득한", "달콤한", "얼큰한", "바삭한", "든든한", "촉촉한", "화끈한", "말랑한", "뜨끈한"];
const FOOD = ["밀떡", "쌀떡", "가래떡", "어묵", "순대", "튀김", "김말이", "라볶이", "쫄면", "주먹밥"];
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

export const randomNick = () => `${pick(FEEL)} ${pick(FOOD)} ${Math.floor(Math.random() * 900) + 100}`;

let cache: Me | null = null;
const EMPTY: Me = { device: "", nick: "" };

function read(): Me {
  if (cache) return cache;
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "null") as Me | null;
    if (v?.device && v?.nick) return (cache = v);
  } catch {
    // 시크릿 창 등에서 막히면 이번 화면에서만 쓸 값을 만든다
  }
  cache = { device: crypto.randomUUID(), nick: randomNick() };
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {}
  return cache;
}

export function setNick(nick: string) {
  cache = { ...read(), nick };
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}

// 서버 렌더 때는 빈 값 → 화면이 뜬 뒤 기기 값으로 바뀐다
export const useMe = () => useSyncExternalStore(subscribe, read, () => EMPTY);

export type ApiResult = { ok: boolean; error?: string; existing?: string; id?: string };

// 쓰기 요청 공통: 기기 표시와 닉네임을 붙여 보낸다
export async function send(url: string, body: Record<string, unknown>): Promise<ApiResult> {
  const me = read();
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", "x-ddy-device": me.device },
    body: JSON.stringify({ ...body, nick: me.nick }),
  }).catch(() => null);
  if (!res) return { ok: false, error: "보내지 못했어요. 인터넷 연결을 확인해 주세요" };
  return ((await res.json().catch(() => null)) as ApiResult | null) ?? { ok: false, error: "보내지 못했어요. 잠시 뒤 다시 해 주세요" };
}

// 사진: 긴 쪽 1280px 로 줄여 JPEG 로 다시 만든 뒤 올린다 (찍은 위치 같은 정보는 이때 지워진다)
export async function uploadPhoto(file: File): Promise<{ id: string } | { error: string }> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return { error: "사진 파일을 읽지 못했어요" };
  }
  const scale = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.82));
  if (!blob) return { error: "사진을 줄이지 못했어요" };
  const res = await fetch("/api/photos", { method: "POST", headers: { "content-type": "image/jpeg", "x-ddy-device": read().device }, body: blob }).catch(() => null);
  const json = (await res?.json().catch(() => null)) as { ok?: boolean; id?: string; error?: string } | null;
  return json?.ok && json.id ? { id: json.id } : { error: json?.error ?? "사진을 올리지 못했어요" };
}
