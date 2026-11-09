// 맛집 등록 · 정보 고치기 View 계약 (리팩토링 계획 2026-11-09 · 계약 단계).
// View 는 props 만 받아 그린다. 상태·핸들러·데이터는 전부 컨테이너가 넘긴다.
// 이 파일은 타입만 둔다. 기존 부품(RegisterForm·EditForm·fields)은 아직 그대로다.

import type { Grade, RiceCake, Spice, Style, Usage } from "@/lib/taxonomy";
import type { Hours, MenuItem, Store } from "@/lib/types";
import type { NewStoreInput } from "@/lib/wiki";

export type LatLng = { lat: number; lng: number };

// 쓰는 중인 등록 내용. 필수 배열·문자열은 비어 있어도 항상 있다 (RegisterForm 의 Draft 와 같다).
export type RegisterDraft = Partial<NewStoreInput> & Pick<NewStoreInput, "name" | "address" | "rice" | "menu" | "photos">;

// ───────── RegisterForm ─────────
// 이 View 가 그리는 것: 다섯 단계(가게·위치 / 떡·맛 / 메뉴·가격 / 소개글 / 사진) 입력칸, 폰 진행 막대·아래 단추, PC 왼쪽 진행 표시, 「쓰다 만 등록」 띠, 오류·중복 안내, 올린 뒤 완료 화면.
// 컨테이너가 넘기는 것: 현재 단계, 입력값, 단계별 완료 여부, 오류·중복 가게 id·완료 가게 id, 보내는 중, 임시 저장 유무, 지도 다시 그리기 키, 지도에 찍을 가게들, 그리고 모든 onX.
// 넘기지 않는 것: router · localStorage(임시 저장) · visualViewport(키보드 높이) · fetch · addMyReport — CHECKS 순회와 포커스 이동(goTo)도 컨테이너가 하고 step·error 로 내려 준다.
export type RegisterFormViewProps = {
  stores: Store[]; // MapPicker 에 함께 찍는 기존 가게
  step: number; // 0~4
  steps: readonly string[]; // 단계 이름
  draft: RegisterDraft;
  done: boolean[]; // 단계마다 채웠는지 (PC 진행 표시 ✓)
  touched: boolean;
  hasSavedDraft: boolean; // localStorage 에 쓰다 만 것이 있다
  draftClosed: boolean; // 띠를 닫았다
  mapKey: number; // 바뀌면 MapPicker 를 새로 그린다 (이어서 쓰기)
  error: string | null;
  dupId: string | null; // 80m 안 같은 이름 가게 → 「그 가게 보기」「다른 가게예요」
  doneId: string | null; // 올라간 가게 id → 완료 화면
  sending: boolean;
  onChange: (patch: Partial<RegisterDraft>) => void; // 칸 하나 바꿈 (touched·error·dup 정리는 컨테이너가)
  onPosition: (p: LatLng) => void; // 지도 가운데 핀
  onNext: () => void; // 폰 「다음」(마지막 단계면 올리기)
  onPrev: () => void;
  onSubmit: (notDuplicate?: boolean) => void; // PC 「지도에 올리기」 · 「다른 가게예요」
  onResumeDraft: () => void;
  onDiscardDraft: () => void;
};

// ───────── EditForm ─────────
// 이 View 가 그리는 것: 메뉴·가격 / 소개글 / 영업시간 / 사진 더하기 / 맵기 / 떡·스타일 / 이용 / 기본 정보(이름·주소·종류·위치 옮기기) / 닉네임 / 오류 / 「고친 내용 올리기」.
// 컨테이너가 넘기는 것: 원래 가게, 지도에 찍을 가게들, 지금 입력값 묶음, 위치 옮기기 열림, 오류, 보내는 중, 값 바꿈·위치 열기·올리기 핸들러.
// 넘기지 않는 것: router · fetch · checkPatch(컨테이너가 하고 error 로) · addMyReport · #intro 해시 처리.
export type EditValues = {
  name: string;
  address: string;
  grade: Grade;
  rice: RiceCake[];
  style: Style;
  spice: Spice;
  menu: MenuItem[];
  hours: Hours | null;
  usage: Usage[];
  memo: string;
  photos: string[]; // 새로 더한 사진 id 만
  pos: LatLng | null; // 옮긴 위치 (moveOpen 일 때만 보낸다)
};
export type EditFormViewProps = {
  store: Store;
  stores: Store[];
  values: EditValues;
  moveOpen: boolean;
  error: string | null;
  sending: boolean;
  onChange: (patch: Partial<EditValues>) => void;
  onOpenMove: () => void;
  onSubmit: () => void;
};
