import type { Store } from "../types";
import { SHOW_SAMPLES, readHistory, readList, readPost, readPosts, readPublicLists, readRecentCount, readReviews, readStore, readStores } from "./db";
import { REGIONS } from "./sample-stores";

// 화면이 데이터를 꺼내는 곳은 여기 하나로 모은다. 저장 방식은 db.ts 안에서만 바꾼다.

const isActive = (s: Store) => (s.status ?? "active") === "active";
// 예시를 숨기면(NEXT_PUBLIC_SAMPLE_DATA=off) 예시 가게·글·리스트는 없는 것처럼 다룬다 (W1-2)
const shown = (x: { isSample?: boolean }) => SHOW_SAMPLES || !x.isSample;

// 지도·목록에 보이는 가게 (가려진 가게·문 닫은 가게는 뺀다)
export async function getStores(): Promise<Store[]> {
  return (await readStores()).filter((s) => isActive(s) && shown(s));
}

// 상세는 가려진 가게도 연다 (주소로 들어온 사람에게 왜 안 보이는지 알려 준다)
export async function getStore(id: string) {
  const s = await readStore(id);
  return s && shown(s) ? s : undefined;
}
export const getReviews = readReviews;
export const getHistory = readHistory;

export const getRecentReportCount = () => readRecentCount(7);

// 떡볶이방 · 맛집 리스트 (11-08)
export const getPosts = async () => (await readPosts()).filter(shown);
export async function getPost(id: string) {
  const r = await readPost(id);
  return r && shown(r.post) ? r : undefined;
}
export const getPublicLists = async () => (await readPublicLists()).filter(shown);
export async function getList(id: string) {
  const l = await readList(id);
  return l && shown(l) ? l : undefined;
}

export function getRegions() {
  return REGIONS;
}

export function getRegion(gu: string) {
  return REGIONS.find((r) => r.gu === gu);
}

// 예시 데이터를 쓰는 동안은 「예시」 띠를 보이고 검색엔진을 막는다 (robots.ts · layout.tsx)
export const USING_SAMPLE_DATA = SHOW_SAMPLES;
