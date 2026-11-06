"use client";

import { useSyncExternalStore } from "react";

// 가게 검색어: 지도 패널과 PC 헤더가 함께 본다. 한글 입력이 끊기지 않게 주소가 아니라 화면 안에 둔다.
let query = "";
const listeners = new Set<() => void>();

export function setSearch(v: string) {
  query = v;
  listeners.forEach((f) => f());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export const useSearch = () => useSyncExternalStore(subscribe, () => query, () => "");
