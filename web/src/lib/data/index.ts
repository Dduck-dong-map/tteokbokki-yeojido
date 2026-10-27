import type { Store } from "../types";
import { REGIONS, SAMPLE_RECENT_REPORTS, SAMPLE_STORES } from "./sample-stores";

// 데이터를 꺼내는 곳은 여기 하나로 모은다.
// 지금은 예시 데이터를 돌려주고, Supabase 를 붙이면(M2) 이 함수들 안만 바꾼다.
// 화면 쪽 코드는 그대로 둔다.

export async function getStores(): Promise<Store[]> {
  return SAMPLE_STORES;
}

export async function getStore(id: string): Promise<Store | undefined> {
  return SAMPLE_STORES.find((s) => s.id === id);
}

export async function getRecentReportCount(): Promise<number> {
  return SAMPLE_RECENT_REPORTS;
}

export function getRegions() {
  return REGIONS;
}

export function getRegion(gu: string) {
  return REGIONS.find((r) => r.gu === gu);
}

export const USING_SAMPLE_DATA = true;
