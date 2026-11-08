import type { Store } from "../types";
import { readHistory, readList, readPost, readPosts, readPublicLists, readRecentCount, readReviews, readStore, readStores } from "./db";
import { REGIONS } from "./sample-stores";

// 화면이 데이터를 꺼내는 곳은 여기 하나로 모은다. 저장 방식은 db.ts 안에서만 바꾼다.

const isActive = (s: Store) => (s.status ?? "active") === "active";

// 지도·목록에 보이는 가게 (가려진 가게·문 닫은 가게는 뺀다)
export async function getStores(): Promise<Store[]> {
  return (await readStores()).filter(isActive);
}

// 상세는 가려진 가게도 연다 (주소로 들어온 사람에게 왜 안 보이는지 알려 준다)
export const getStore = readStore;
export const getReviews = readReviews;
export const getHistory = readHistory;

export const getRecentReportCount = () => readRecentCount(7);

// 떡볶이방 · 맛집 리스트 (11-08)
export const getPosts = readPosts;
export const getPost = readPost;
export const getPublicLists = readPublicLists;
export const getList = readList;

export function getRegions() {
  return REGIONS;
}

export function getRegion(gu: string) {
  return REGIONS.find((r) => r.gu === gu);
}

export const USING_SAMPLE_DATA = true;
