"use client";

import { useCallback, useSyncExternalStore } from "react";

// 내 맛지도(아래 메뉴 셋째 탭): 가게 상세의 ♡ 로 저장한 가게 · 다녀옴 표시 · 내가 올린 등록·수정 (저장 칸 이름 reports 는 그대로 둔다).
// 로그인 없이 이 기기(localStorage)에만 둔다. 계정이 생기면(2차) 이 파일 안만 서버 저장으로 바꾼다.
// 보드 N3-05 「내 맛지도 · 저장한 가게」(11-02) 그대로.

export type SavedStore = { at: string; visited?: boolean }; // at = 저장한 날 YYYY-MM-DD
export type MyReport = { at: string; kind: "new" | "edit" | "closed"; storeId?: string; name: string };
export type Mine = { saved: Record<string, SavedStore>; reports: MyReport[] };

const KEY = "ddy-mine";
const EMPTY: Mine = { saved: {}, reports: [] };
const EVENT = "ddy-mine-change";

let cache: Mine | null = null;

function read(): Mine {
  if (cache) return cache;
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(KEY) : null;
    const v = raw ? (JSON.parse(raw) as Partial<Mine>) : null;
    cache = { saved: v?.saved ?? {}, reports: v?.reports ?? [] };
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function write(next: Mine) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // 시크릿 창 등에서 저장이 막혀도 화면은 그대로 돈다
  }
  window.dispatchEvent(new Event(EVENT));
}

const today = () => new Date(Date.now() + 9 * 3_600_000).toISOString().slice(0, 10);

export function toggleSave(id: string) {
  const m = read();
  const saved = { ...m.saved };
  if (saved[id]) delete saved[id];
  else saved[id] = { at: today() };
  write({ ...m, saved });
  return !!saved[id];
}

export function toggleVisited(id: string) {
  const m = read();
  const cur = m.saved[id];
  if (!cur) return;
  write({ ...m, saved: { ...m.saved, [id]: { ...cur, visited: !cur.visited } } });
}

export function addMyReport(r: Omit<MyReport, "at">) {
  const m = read();
  write({ ...m, reports: [{ ...r, at: today() }, ...m.reports].slice(0, 200) });
}

function subscribe(cb: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      cb();
    }
  };
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", onStorage);
  };
}

// 서버 렌더 때는 빈 값 → 화면이 뜬 뒤 기기 값으로 바뀐다 (hydration 어긋남 없음)
export function useMine(): Mine {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function useSaved(id: string) {
  const m = useMine();
  const on = !!m.saved[id];
  const toggle = useCallback(() => toggleSave(id), [id]);
  return { on, toggle, visited: !!m.saved[id]?.visited };
}
