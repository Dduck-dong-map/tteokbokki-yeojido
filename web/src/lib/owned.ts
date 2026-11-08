"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { Owned } from "./community";
import { myDevice } from "./me";

// 「내 것」(내 리스트 · 내 글 · 내 댓글 · 추천한 리스트)을 서버에서 한 번 받아 화면 여러 곳이 같이 쓴다.
// 쓰기가 끝나면 refreshOwned() 로 다시 받는다.

const EMPTY: Owned = { lists: [], posts: [], comments: [], liked: [], likedPosts: [] };
let state: { data: Owned; loaded: boolean } = { data: EMPTY, loaded: false };
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function refreshOwned() {
  inflight = fetch("/api/me", { headers: { "x-ddy-device": myDevice() }, cache: "no-store" })
    .then((r) => (r.ok ? (r.json() as Promise<Owned>) : EMPTY))
    .catch(() => EMPTY)
    .then((data) => {
      state = { data, loaded: true };
      emit();
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

const SERVER = { data: EMPTY, loaded: false };

// loaded=false 동안은 「내 것 아님」으로 그린다 (지우기·고치기 단추가 늦게 나타난다)
export function useOwned() {
  const s = useSyncExternalStore(subscribe, () => state, () => SERVER);
  useEffect(() => {
    if (!state.loaded && !inflight) void refreshOwned();
  }, []);
  return s;
}
