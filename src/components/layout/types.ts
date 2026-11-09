// 화면 틀 View 계약 (리팩토링 계획 2026-11-09 · 화면 ①).
// View 는 props 만 받아 그린다. 현재 경로·라우터·검색 상태는 컨테이너(SiteHeader.tsx)가 끝낸다.

import type { FormEvent, ReactNode } from "react";
import type { NavKey } from "./nav";

// ───────── SiteHeader ─────────
// 이 View 가 그리는 것: 768 이상 위 헤더 — 로고 · 검색칸 슬롯 · 메뉴 셋 · 「＋ 맛집 등록」.
// 컨테이너가 넘기는 것: 활성 메뉴, 검색 제출 핸들러, 검색칸(SearchBox 는 자체 상태를 가진 기존 부품이라 슬롯으로 받는다).
// 넘기지 않는 것: pathname · router · matchMedia.
export type SiteHeaderViewProps = {
  active?: NavKey;
  onSearchSubmit: (e: FormEvent<HTMLFormElement>) => void;
  search: ReactNode;
};

// ───────── SearchBox ─────────
// 이 View 가 그리는 것: 돋보기 · 입력칸(16px) · 지우기 단추.
// 컨테이너가 넘기는 것: 현재 검색어와 변경·지우기 핸들러.
export type SearchBoxViewProps = {
  value: string;
  onChange: (v: string) => void;
  onClear: () => void;
};
