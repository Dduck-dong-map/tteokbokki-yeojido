// 맛집 리스트 View 계약 (리팩토링 계획 2026-11-09 · 계약 단계).
// View 는 props 만 받아 그린다. 상태·핸들러·데이터는 전부 컨테이너가 넘긴다.
// 이 파일은 타입만 둔다. 컨테이너(ListPanel·ListInfoForm·AddToList·StorePicker)는 같은 폴더의 *View 에 이 props 를 넘긴다.

import type { Focus } from "@/components/map/TteokMap";
import type { ListVisibility, PlaceList } from "@/lib/community";
import type { Store } from "@/lib/types";
import type { PickStore } from "./StorePicker";

// 이름 · 설명 · 공개 범위 입력 (새로 만들 때와 고칠 때 같이 쓴다)
export type ListInfoValues = { title: string; desc: string; visibility: ListVisibility };

// ───────── ListInfoForm ─────────
// 이 View 가 그리는 것: 리스트 이름 · 설명 · 공개 범위 칩과 그 설명 · 오류 · 그만두기/저장.
// 컨테이너가 넘기는 것: 세 값, 오류, 보내는 중, 단추 글자, 값 바꿈·저장·취소 핸들러.
// 넘기지 않는 것: checkListInfo(컨테이너가 하고 error 로) · fetch.
export type ListInfoFormViewProps = {
  values: ListInfoValues;
  error: string | null;
  busy: boolean;
  submitLabel?: string;
  onChange: (patch: Partial<ListInfoValues>) => void;
  onSubmit: () => void;
  onCancel?: () => void;
};

// ───────── ListPanel ─────────  (옛 이름 ListView 는 View 접미사와 겹쳐 ListPanel 로 바꿨다 · 계획 ⑧)
// 이 View 가 그리는 것: 머리(이름·설명·누가·추천·공유·고치기 또는 ListInfoForm) · 폰 지도 · 오류 · 번호 붙은 가게 줄(내 것이면 ↑↓·빼기) · 빈 상태 · 가게 넣기(StorePicker) · 리스트 지우기 · PC 오른쪽 큰 지도.
// 컨테이너가 넘기는 것: 리스트, 담긴 가게(순서대로), 고를 수 있는 가게, 기준 시각, 내 것 여부, 화면 폭, 고른 가게·고치는 중·지우기 묻는 중, 오류, 지도 처음 위치·초점, 이미 담긴 id, 그리고 모든 onX.
// 넘기지 않는 것: router · fetch · refreshOwned · useOwned · useIsWide · scrollIntoView(선택은 onSelect 로만 알린다).
export type ListPanelViewProps = {
  list: PlaceList;
  stores: Store[]; // list.storeIds 순서대로
  pick: PickStore[];
  now: Date;
  mine: boolean;
  wide: boolean;
  selectedId: string | null;
  editing: boolean;
  askDelete: boolean;
  message: string | null;
  start?: { lat: number; lng: number; zoom: number };
  focus: Focus | null;
  inList: Set<string>;
  info: ListInfoFormViewProps; // editing 일 때 머리 대신 그린다
  onSelect: (id: string | null) => void;
  onEditStart: () => void;
  onMove: (storeId: string, dir: -1 | 1) => void;
  onRemove: (storeId: string) => void;
  onAdd: (storeId: string) => void;
  onAskDelete: (asking: boolean) => void;
  onDelete: () => void;
};

// ───────── AddToList ─────────
// 이 View 가 그리는 것: 「＋ 내 리스트에 담기 / ✓ N곳에 담김」 단추 · 펼친 칸(내 리스트 체크 목록 · 새 리스트 이름+만들고 담기 · 결과 문구 · 「내 리스트 모두 보기」).
// 컨테이너가 넘기는 것: 내 리스트, 불러왔는지, 열림, 새 이름, 어느 리스트가 보내는 중인지, 결과 문구, 담긴 수, 토글·체크·이름 바꿈·만들기 핸들러.
// 넘기지 않는 것: storeId(핸들러가 묶는다) · fetch · refreshOwned · useOwned.
export type AddToListViewProps = {
  lists: PlaceList[];
  loaded: boolean;
  open: boolean;
  title: string;
  busyId: string | null; // 리스트 id 또는 "new"
  message: string | null;
  count: number; // 이 가게가 담긴 내 리스트 수
  has: (listId: string) => boolean; // 이 가게가 그 리스트에 있는지
  onToggleOpen: () => void;
  onToggleList: (listId: string) => void;
  onTitleChange: (v: string) => void;
  onCreate: () => void;
};

// ───────── StorePicker ─────────
// 이 View 가 그리는 것: 검색 입력칸과 결과 목록(최대 8줄) 또는 「찾는 가게가 없어요」.
// 컨테이너가 넘기는 것: 검색어, 이미 걸러진 결과, 안내 글, 자동 포커스, 검색어 바꿈·고름 핸들러.
// 넘기지 않는 것: 전체 가게 배열 · exclude 집합 — 거르기(이름·동, 8개 자르기)는 컨테이너가 한다.
export type StorePickerViewProps = {
  query: string;
  hits: PickStore[];
  placeholder?: string;
  autoFocus?: boolean;
  onQueryChange: (q: string) => void;
  onPick: (id: string) => void;
};
