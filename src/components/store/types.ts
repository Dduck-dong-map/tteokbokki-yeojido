// 가게 상세 동작 부품 View 계약 (리팩토링 계획 2026-11-09 · 계약 단계).
// View 는 props 만 받아 그린다. 상태·핸들러·데이터는 전부 컨테이너가 넘긴다.
// 이 파일은 타입만 둔다. 기존 부품(StoreActions 안 여덟 개 · SaveButton)은 아직 그대로다.

import type { FlagReason } from "@/lib/wiki";

// ───────── SaveButton ─────────
// 이 View 가 그리는 것: 머리칸 오른쪽 ♡/♥ 단추와 잠깐 뜨는 토스트.
// 컨테이너가 넘기는 것: 가게 이름(aria-label), 찜 여부, 토스트 문구, 누름 핸들러.
// 넘기지 않는 것: localStorage(lib/mine) · 타이머 — 컨테이너가 toggleSave 와 토스트 시간을 맡는다.
export type SaveButtonViewProps = {
  name: string;
  on: boolean;
  toast: string | null;
  onPress: () => void;
};

// ───────── StillHere ─────────
// 이 View 가 그리는 것: 「아직 있어요」 단추와 결과·안내 문구.
// 컨테이너가 넘기는 것: 위치 확인 중 여부, 문구, 누름 핸들러.
// 넘기지 않는 것: geolocation · 거리 계산 · fetch — 200m 판정은 컨테이너에서.
export type StillHereViewProps = {
  busy: boolean;
  message: string | null;
  onPress: () => void;
};

// ───────── CopyAddress ─────────
// 이 View 가 그리는 것: 「주소 복사」/「복사했어요」 칩.
// 컨테이너가 넘기는 것: 복사됨 여부, 누름 핸들러.
// 넘기지 않는 것: clipboard API · 되돌리는 타이머.
export type CopyAddressViewProps = {
  copied: boolean;
  onCopy: () => void;
};

// ───────── GoLinks ─────────
// 이 View 가 그리는 것: 「네이버 지도로 길찾기」「카카오맵」 두 링크(새 창).
// 컨테이너가 넘기는 것: 두 주소, 누름 핸들러(어느 앱인지).
// 넘기지 않는 것: 누름 기록 요청(W1-4) — 컨테이너가 보낸다.
export type GoLinksViewProps = {
  naver: string;
  kakao: string;
  onGo: (app: "naver" | "kakao") => void;
};

// ───────── VerifyButtons · VerifyBar ─────────
// 이 View 가 그리는 것: 「맞아요」「달라요」 두 단추(+안내 문구). VerifyBar 는 그 위에 등록자·집계 설명을 얹은 칸.
// 컨테이너가 넘기는 것: 보내는 중 여부, 결과 문구, 투표 핸들러; Bar 는 등록자 닉네임과 맞아요·달라요 수까지.
// 넘기지 않는 것: fetch · router.refresh · VERIFY_YES/HIDE_AT 상수(View 가 lib/wiki 에서 직접 읽어도 된다).
export type VerifyButtonsViewProps = {
  busy: boolean;
  message: string | null;
  compact?: boolean;
  onVote: (ok: boolean) => void;
};
export type VerifyBarViewProps = {
  by?: string;
  yes: number;
  no: number;
  verify: VerifyButtonsViewProps;
};

// ───────── AddPhoto ─────────
// 이 View 가 그리는 것: 사진 더하기 칸(작은 칸 또는 큰 빈 상태)과 파일 입력.
// 컨테이너가 넘기는 것: 올리는 중 여부, 오류 문구, 큰 칸 여부, 파일 고름 핸들러.
// 넘기지 않는 것: uploadPhoto · 서버 patch · router.refresh.
export type AddPhotoViewProps = {
  busy: boolean;
  message: string | null;
  large?: boolean;
  onFiles: (files: FileList | null) => void;
};

// ───────── ReviewForm ─────────
// 이 View 가 그리는 것: 접힌 「별점과 한 줄 후기 남기기」 단추 ↔ 펼친 폼(별 · 한 줄 · 닉네임 · 닫기/올리기).
// 컨테이너가 넘기는 것: 열림 여부, 별점·글 값, 오류, 보내는 중, 각 바꿈·열기·닫기·올리기 핸들러.
// 넘기지 않는 것: fetch · router.refresh · checkReview 호출(컨테이너가 하고 error 로 내려 준다).
export type ReviewFormViewProps = {
  open: boolean;
  stars?: number;
  text: string;
  error: string | null;
  busy: boolean;
  onOpen: () => void;
  onClose: () => void;
  onStarsChange: (v?: number) => void;
  onTextChange: (v: string) => void;
  onSubmit: () => void;
};

// ───────── FlagReviewButton ─────────
// 이 View 가 그리는 것: 후기 옆 「신고」 글자 단추, 보낸 뒤에는 결과 문구.
// 컨테이너가 넘기는 것: 결과 문구, 신고 핸들러.
// 넘기지 않는 것: storeId·reviewId — 핸들러가 이미 묶어 둔다.
export type FlagReviewButtonViewProps = {
  message: string | null;
  onFlag: () => void;
};

// ───────── MoreActions ─────────
// 이 View 가 그리는 것: 정보 고치기 · 변경 이력 · 공유 · 신고 넷 + 펼친 신고 이유 목록 + 결과 문구.
// 컨테이너가 넘기는 것: 가게 id(링크 주소), 신고 목록 열림, 결과 문구, 공유·신고 토글·신고 이유 핸들러.
// 넘기지 않는 것: navigator.share · clipboard · fetch · router.refresh.
export type MoreActionsViewProps = {
  storeId: string;
  flagOpen: boolean;
  message: string | null;
  onShare: () => void;
  onToggleFlag: () => void;
  onFlag: (reason: FlagReason) => void;
};

// 상세 페이지 컨테이너가 한 번에 쥐는 묶음 (부품별로 따로 써도 된다)
export type StoreActionsViewProps = {
  stillHere: StillHereViewProps;
  copyAddress: CopyAddressViewProps;
  verifyBar?: VerifyBarViewProps; // 확인 중인 가게만
  addPhoto: AddPhotoViewProps;
  review: ReviewFormViewProps;
  more: MoreActionsViewProps;
};
