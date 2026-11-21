// 떡볶이방(게시판) View 계약 (리팩토링 계획 2026-11-09 · 계약 단계).
// View 는 props 만 받아 그린다. 상태·핸들러·데이터는 전부 컨테이너가 넘긴다.
// 이 파일은 타입만 둔다. 기존 부품(RoomBoard·PostForm)은 아직 그대로다.

import type { BoardCat, Post } from "@/lib/community";
import type { PickStore } from "@/components/lists/StorePicker";

export type BoardCatFilter = BoardCat | "all";

// ───────── RoomBoard ─────────
// 이 View 가 그리는 것: 제목·「글쓰기」 · 말머리 탭 · 글 줄 목록(말머리 · 제목 · [댓글 수] / 닉네임 · 시각 · 👍 · 📍가게) · 빈 상태.
// 컨테이너가 넘기는 것: 이미 말머리로 걸러진 글, 고른 말머리, 가게 이름 표, 기준 시각, 예시 띠 여부, 말머리 바꿈 핸들러.
// 넘기지 않는 것: 전체 글 배열(거르기는 컨테이너) · fetch.
export type RoomBoardViewProps = {
  posts: Post[]; // cat 으로 걸러진 글 (최신순)
  cat: BoardCatFilter;
  storeNames: Record<string, string>;
  now: Date;
  onCatChange: (cat: BoardCatFilter) => void;
};

// ───────── PostForm ─────────
// 이 View 가 그리는 것: 말머리 칩 · 제목 · 내용(글자 수) · 사진(선택, 11-21) · 가게 붙이기(고른 가게 또는 StorePicker) · 닉네임 안내 · 오류 · 「올리기」.
// 컨테이너가 넘기는 것: 말머리·제목·내용·사진 id·붙인 가게, 고를 수 있는 가게들, 닉네임, 보내는 중, 오류, 각 바꿈·올리기 핸들러.
// 사진 올리기(/api/photos)는 고르기 칸(register/fields PhotoPicker)이 고르는 즉시 하고 id 만 넘긴다 — 가게 등록과 같다.
// 넘기지 않는 것: router · fetch · refreshOwned · checkPost(컨테이너가 하고 error 로).
export type PostFormViewProps = {
  cat: BoardCat;
  title: string;
  body: string;
  photos: string[]; // 올린 사진 id
  store: PickStore | null; // 붙인 가게 (없으면 StorePicker)
  stores: PickStore[];
  nick: string;
  busy: boolean;
  error: string | null;
  onCatChange: (cat: BoardCat) => void;
  onTitleChange: (v: string) => void;
  onBodyChange: (v: string) => void;
  onPhotosChange: (ids: string[]) => void;
  onStoreChange: (id: string | null) => void;
  onSubmit: () => void;
};
