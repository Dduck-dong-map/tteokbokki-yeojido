// 지도 홈 View 계약 (리팩토링 계획 2026-11-09 · 계약 단계).
// View 는 props 만 받아 그린다. 상태·핸들러·데이터는 전부 컨테이너가 넘긴다.
// 이 파일은 타입만 둔다. 계약은 컨테이너(MapShell.tsx)가 소유하고, View 는 받기만 한다.

import type { Bounds, Focus } from "@/components/map/TteokMap";
import type { Filters } from "@/lib/filters";
import type { Store } from "@/lib/types";
import type { KeyboardEvent, PointerEvent, ReactNode, RefObject } from "react";

export type LatLng = { lat: number; lng: number };
export type SheetState = "peek" | "half" | "full";
export type SortKey = "near" | "recent";

// 패널 위 필터 칩 하나 (떡 · 스타일 · 맵기 · 가격). 켜짐 여부는 컨테이너가 계산한다.
export type FilterChip = { id: string; label: string; on: boolean };

// ───────── MapShell ─────────
// 이 View 가 그리는 것: 폰 헤더(로고·최근 등록 수) · 검색+필터 단추 · 큰 지도 · 내 위치/등록 단추 · 가게 목록 시트(패널) · 빈 상태 · 아래 메뉴 · 상세 슬롯(children).
// 컨테이너가 넘기는 것: 걸러지고 정렬된 가게 줄, 지도에 찍을 가게, 선택·열린 가게 id, 필터 상태와 개수, 시트 상태, 내 위치, 지도 초점, 토스트, 그리고 모든 onX.
// 넘기지 않는 것: router · searchParams · pathname · window.history · geolocation · matchMedia(폭) 읽기 — 전부 컨테이너 안에서 끝낸다.
export type MapShellViewProps = {
  // 데이터
  stores: Store[]; // 전체 (빈 상태의 「가게 N곳이 다시 보여요」 숫자)
  shown: Store[]; // 필터 + 검색어를 통과한 가게 (지도에 찍는다)
  list: Store[]; // shown 중 지도 범위 안 + 정렬까지 끝난 줄
  inViewCount: number; // 「현재 지도에서 찾은 가게 N곳」
  searching: boolean; // 검색어가 있으면 지도 범위를 무시했다는 뜻
  query: string;
  recentReports: number;
  now: Date; // 기준 시각 — 줄마다 「확인 N일 전」·확인 중 표를 계산할 때 StoreRowView 에 그대로 넘긴다 (렌더마다 새로 만들지 않도록 컨테이너가 한 번 정한다)
  // 선택 · 화면
  selectedId: string | null; // 목록·지도에서 고른 가게
  routeId: string | null; // 열린 상세(/store/[id])
  wide: boolean; // 768 이상
  sheet: SheetState;
  mapOn: boolean;
  mapSettled: boolean;
  start?: { lat: number; lng: number; zoom: number };
  focus: Focus | null;
  me: LatLng | null;
  toast: string | null;
  // 정렬
  sort: SortKey; // 실제 적용 중인 정렬 (null 해석은 컨테이너가 끝낸다)
  canSortNear: boolean; // 내 위치가 있을 때만
  // 필터
  filters: Filters;
  filterCount: number;
  filterChips: FilterChip[];
  filterOpen: boolean;
  countWith: (f: Filters) => number; // FilterSheet 가 고를 때마다 「가게 N곳」
  // 핸들러
  onPick: (store: Store) => void; // 목록 줄
  onSelectFromMap: (id: string | null) => void; // 지도 도장
  onBoundsChange: (b: Bounds) => void;
  onMapSettled: () => void;
  onSortChange: (k: SortKey) => void;
  onSheetChange: (s: SheetState) => void; // 손잡이 탭·끌기 결과
  onFilterOpen: (sectionId?: string) => void;
  onFilterClose: () => void;
  onFiltersChange: (f: Filters) => void;
  onResetAll: () => void; // 필터 + 검색어 초기화
  onLocate: () => void; // 내 위치 단추
  onShowAll: () => void; // 「가게 N곳 모두 보기」(범위 밖일 때)
  children: ReactNode; // 가게 상세
  // 선택 사항 — 폰 시트 손잡이 끌기와 PC 키보드 이동. View 가 안 받아도 타입은 통과하고, 받으면 끌기·↑↓ 이동이 살아난다.
  listRef?: RefObject<HTMLUListElement | null>; // 고른 줄로 스크롤(`#row-<id>` 는 <li>)·↑↓ 이동 대상(`li > button`)을 찾는 <ul>
  onListKeyDown?: (e: KeyboardEvent<HTMLElement>) => void; // <ul> 의 onKeyDown (ArrowUp/Down)
  onHandlePointerDown?: (e: PointerEvent<HTMLElement>) => void; // 시트 손잡이: 끌기 시작 y 기록
  onHandlePointerUp?: (e: PointerEvent<HTMLElement>) => void; // 시트 손잡이: 끌린 거리로 한 단계 이동, 짧으면 반 ↔ 전체 (onSheetChange 를 대신한다)
  onHandlePointerCancel?: (e: PointerEvent<HTMLElement>) => void; // 시트 손잡이: 끌기 취소
};

// ───────── FilterSheet ─────────
// 이 View 가 그리는 것: 떡·스타일·맵기·가격·더 고르기 칩과 「가게 N곳 보기」/「필터 초기화」 단추. 폰은 아래 시트, 768 이상은 패널 안 칸(inline).
// 컨테이너가 넘기는 것: 현재 필터 값, 그 값으로 걸러진 가게 수, 바꿀 때·닫을 때 핸들러.
// 넘기지 않는 것: 가게 배열 · now — 개수 계산은 컨테이너(countWith)가 한다.
export type FilterSheetViewProps = {
  value: Filters;
  resultCount: number; // value 로 걸러진 가게 수 (0 이면 초기화 단추)
  inline?: boolean;
  onChange: (f: Filters) => void;
  onClose: () => void;
};

// ───────── StoreRow ─────────
// 이 View 가 그리는 것: 목록 한 줄 — 썸네일 · 이름(확인 중 표) · 동·거리·확인 시점 · 스타일·떡 · 별점 · 맵기 도장 · 대표 가격, 고른 줄이면 「자세히 · 길찾기」.
// 컨테이너가 넘기는 것: 가게 하나, 내 위치, 기준 시각, 선택 여부, 누름 핸들러.
// 넘기지 않는 것: 목록 전체 · 정렬 · router (이동은 Link 로만).
export type StoreRowViewProps = {
  store: Store;
  me: LatLng | null;
  now: Date;
  selected: boolean;
  onPick: () => void;
};
