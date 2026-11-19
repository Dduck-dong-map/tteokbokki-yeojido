// 내 맛지도 View 계약 (리팩토링 계획 2026-11-09 · 계약 단계).
// View 는 props 만 받아 그린다. 상태·핸들러·데이터는 전부 컨테이너가 넘긴다.
// 이 파일은 타입만 둔다. 기존 부품(MinePage)은 아직 그대로다.

import type { ListInfoFormViewProps } from "@/components/lists/types";
import type { PlaceList } from "@/lib/community";
import type { MyReport, SavedStore } from "@/lib/mine";
import type { Store } from "@/lib/types";

export type MineTab = "my" | "all" | "saved" | "reports";
export type ListSort = "likes" | "new";
export type LatLng = { lat: number; lng: number };

// 찜한 가게 한 줄 = 가게 + 찜 기록(저장일·다녀옴)
export type SavedRow = { s: Store; v: SavedStore };

// ───────── MinePage ─────────
// 이 View 가 그리는 것: 제목 · 네 탭(개수) · 예시 띠 · 오류 · [내 리스트] 새로 만들기(ListInfoForm)+카드 격자 · [모두의 리스트] 정렬+카드 격자 · [찜한 가게] 다녀온 곳만·찜으로 리스트 만들기·가게 줄(다녀옴·♥) · [내 등록] 줄 · 아래 메뉴.
// 컨테이너가 넘기는 것: 고른 탭, 탭별 개수, 가게 표, 내 리스트·공개 리스트(정렬 끝), 불러왔는지, 찜 줄(정렬·거르기 끝), 내 등록, 내 위치, 기준 시각, 정렬·다녀온 곳만·만드는 중, 오류, 그리고 모든 onX.
// 넘기지 않는 것: router · window.history.replaceState(탭 주소) · localStorage(lib/mine) · useOwned · fetch · useGrantedLocation.
export type MinePageViewProps = {
  tab: MineTab;
  counts: Record<MineTab, number>;
  stores: Map<string, Store>; // id → 가게 (ListCard 도장)
  myLists: PlaceList[];
  ownedLoaded: boolean;
  publicLists: PlaceList[]; // sort 가 적용된 순서
  publicCount: number;
  sort: ListSort;
  saved: SavedRow[]; // 전체 찜 (정렬 끝)
  savedShown: SavedRow[]; // 다녀온 곳만 거른 결과
  onlyVisited: boolean;
  reports: MyReport[];
  me: LatLng | null;
  now: Date;
  creating: boolean;
  message: string | null;
  createForm: ListInfoFormViewProps; // creating 일 때
  onTabChange: (tab: MineTab) => void;
  onSortChange: (sort: ListSort) => void;
  onToggleOnlyVisited: () => void;
  onCreatingChange: (creating: boolean) => void;
  onCreateFromSaved: () => void; // 「찜한 N곳으로 리스트 만들기」
  onToggleVisited: (storeId: string) => void;
  onUnsave: (storeId: string) => void;
};
