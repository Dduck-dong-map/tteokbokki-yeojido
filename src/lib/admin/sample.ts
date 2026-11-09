import type { RiceCake, Spice, Style } from "../taxonomy";

// 어드민 시안용 예시 데이터. 실제 제보·사람이 아니다.
// 시간 계산은 고정된 기준 시각으로 한다(화면이 늘 같게 보이도록).
export const SAMPLE_NOW = "2026-10-27T18:00:00+09:00";

export type Role = "owner" | "moderator" | "crew";
export const ROLE_LABEL: Record<Role, string> = { owner: "관리자", moderator: "운영자", crew: "크루" };

export type ReportKind = "new" | "edit" | "closed";
export const KIND_LABEL: Record<ReportKind, string> = { new: "새 가게", edit: "정보 수정", closed: "폐업 신고" };

export type ReportStatus = "pending" | "agree" | "auto" | "approved" | "rejected";

export type ReportFlag = "dup_suspect" | "spam_device" | "far_pin" | "many_same";
export const FLAG_LABEL: Record<ReportFlag, string> = {
  dup_suspect: "중복 의심",
  spam_device: "도배 의심 기기",
  far_pin: "주소와 핀이 멂",
  many_same: "같은 내용 여러 건",
};

export type ReportFields = {
  name?: string;
  address?: string;
  rice?: RiceCake[];
  style?: Style;
  spice?: Spice;
  price?: number;
  hours?: string;
};

export type AdminReport = {
  id: number;
  kind: ReportKind;
  status: ReportStatus;
  storeId?: string; // 수정·폐업 대상
  at: string; // 접수 시각
  device: string; // 기기 해시 앞자리
  fields: ReportFields;
  sameCount?: number; // 같은 내용 제보 수
  agreements?: number; // 가격·맵기 수정 동의 수 (2 이면 자동 반영)
  flags?: ReportFlag[];
  dupOf?: string; // 중복 의심 대상 가게
  photo?: boolean;
  handledBy?: string;
  rejectReason?: string;
};

export const REJECT_REASONS = ["이미 있는 가게(중복)", "등재 기준 미달", "정보가 부족함", "장난·도배", "사진 문제(사람 얼굴 등)", "기타"] as const;

export const ADMIN_REPORTS: AdminReport[] = [
  { id: 1042, kind: "closed", status: "pending", storeId: "ahyeon-old", at: "2026-10-26 20:41", device: "a91f", fields: {}, sameCount: 3, flags: ["many_same"] },
  { id: 1041, kind: "new", status: "pending", at: "2026-10-27 08:12", device: "c03b", flags: ["dup_suspect"], dupOf: "mangwon-soup",
    fields: { name: "망원동 할매 국물떡볶이", address: "서울 마포구 망원동 (예시 주소)", rice: ["wheat"], style: "soup", spice: 2, price: 4000 } },
  { id: 1040, kind: "new", status: "pending", at: "2026-10-27 10:05", device: "7d2e", photo: true,
    fields: { name: "공덕시장 즉석떡볶이 (예시 제보)", address: "서울 마포구 공덕동 (예시 주소)", rice: ["wheat", "mini"], style: "instant", spice: 3, price: 5500 } },
  { id: 1039, kind: "edit", status: "pending", storeId: "yeonnam-jjajang", at: "2026-10-27 11:30", device: "51aa",
    fields: { hours: "10:00 ~ 21:00 · 일 쉼" } },
  { id: 1036, kind: "new", status: "pending", at: "2026-10-27 13:02", device: "ff00", flags: ["spam_device"],
    fields: { name: "ㅋㅋ떡볶이", address: "아무데나", rice: ["rice"], style: "classic", spice: 5 } },
  { id: 1038, kind: "edit", status: "agree", storeId: "seogyo-hell", at: "2026-10-27 09:48", device: "0b7c", agreements: 1, fields: { price: 5500 } },
  { id: 1035, kind: "edit", status: "agree", storeId: "hapjeong-rose", at: "2026-10-26 18:20", device: "e1d4", agreements: 0, fields: { spice: 3 } },
  { id: 1037, kind: "edit", status: "auto", storeId: "sinchon-cheese", at: "2026-10-26 15:10", device: "9a3c", agreements: 2, fields: { spice: 5 } },
  { id: 1031, kind: "new", status: "approved", at: "2026-10-25 12:00", device: "44b1", handledBy: "이시영",
    fields: { name: "대흥동 시장 분식 (예시)", address: "서울 마포구 대흥동 (예시 주소)", rice: ["wheat", "mini"], style: "classic", spice: 3, price: 4000 } },
  { id: 1029, kind: "new", status: "rejected", at: "2026-10-24 21:15", device: "ff00", handledBy: "이시영", rejectReason: "장난·도배",
    fields: { name: "떡볶이맛집ㅋ", address: "?", rice: ["rice"], style: "classic", spice: 5 } },
];

export type FlagKind = "owner" | "wrong" | "photo" | "system";
export const FLAG_KIND_LABEL: Record<FlagKind, string> = { owner: "사장님 요청", wrong: "정보 신고", photo: "사진 신고", system: "자동 알림" };

export type AdminFlag = {
  id: number;
  kind: FlagKind;
  storeId?: string;
  at: string;
  summary: string;
  status: "open" | "done";
};

export const ADMIN_FLAGS: AdminFlag[] = [
  { id: 77, kind: "owner", storeId: "mangwon-market-oil", at: "2026-10-26 16:02", summary: "1인분 4,000원으로 올랐어요. 일요일은 쉬어요. (사장님, 연락처 확인 필요)", status: "open" },
  { id: 76, kind: "system", storeId: "gajwa-pojang", at: "2026-10-26 12:40", summary: "마지막 확인 249일 — 「아직 있어요」가 오늘 2번 들어왔어요. 확인일을 새로 고칠까요?", status: "open" },
  { id: 75, kind: "photo", storeId: "hapjeong-rose", at: "2026-10-25 19:30", summary: "제보 사진에 다른 손님 얼굴이 보여요", status: "open" },
  { id: 74, kind: "wrong", storeId: "yeonhui-gimbap", at: "2026-10-24 10:11", summary: "가게 위치가 한 블록 옆으로 찍혀 있어요", status: "done" },
];

export type AuditEntry = { at: string; actor: string; role: Role; action: string; target: string; detail: string };

export const AUDIT_LOG: AuditEntry[] = [
  { at: "2026-10-27 09:02", actor: "이시영", role: "owner", action: "제보 승인", target: "#1031 대흥동 시장 분식", detail: "새 가게 등록 · 확인일 2026-10-27" },
  { at: "2026-10-26 22:15", actor: "시스템", role: "owner", action: "자동 반영", target: "#1037 신촌 치즈떡볶이", detail: "맵기 4 → 5 (동의 2)" },
  { at: "2026-10-26 18:40", actor: "크루 A (예시)", role: "crew", action: "확인함", target: "대흥동 시장 분식", detail: "방문 확인 · 가격 그대로" },
  { at: "2026-10-26 11:20", actor: "이시영", role: "owner", action: "기기 차단", target: "기기 ff00", detail: "도배 · 7일" },
  { at: "2026-10-25 21:30", actor: "이시영", role: "owner", action: "제보 반려", target: "#1029 떡볶이맛집ㅋ", detail: "사유: 장난·도배" },
  { at: "2026-10-25 14:05", actor: "운영자 (예시)", role: "moderator", action: "가게 수정", target: "합정 로제떡볶이 연구소", detail: "영업시간 11:00 → 11:30" },
  { at: "2026-10-24 10:30", actor: "운영자 (예시)", role: "moderator", action: "신고 처리", target: "#74 연희동 김밥과 떡볶이", detail: "위치 핀 옮김" },
];

export type Staff = { name: string; role: Role; email: string; twoFactor: boolean; lastSeen: string; area?: string };

export const STAFF: Staff[] = [
  { name: "이시영", role: "owner", email: "관리자 계정", twoFactor: true, lastSeen: "2026-10-27 09:02" },
  { name: "운영자 (예시)", role: "moderator", email: "moderator@example.com", twoFactor: true, lastSeen: "2026-10-25 14:05" },
  { name: "크루 A (예시)", role: "crew", email: "crew-a@example.com", twoFactor: false, lastSeen: "2026-10-26 18:40", area: "마포구" },
  { name: "크루 B (예시)", role: "crew", email: "crew-b@example.com", twoFactor: false, lastSeen: "2026-10-22 13:10", area: "서대문구" },
];

// 공공데이터 일반음식점 인허가에서 고른 후보 (M4 미리보기, 가짜)
export type Candidate = { id: number; name: string; address: string; kind: string; status: "new" | "assigned" | "confirmed" | "duplicate" | "skip"; assignee?: string; match?: string };

export const CANDIDATES: Candidate[] = [
  { id: 1, name: "○○분식 (후보 예시)", address: "서울 마포구 성산동 (예시)", kind: "분식", status: "new" },
  { id: 2, name: "△△떡볶이 (후보 예시)", address: "서울 마포구 서교동 (예시)", kind: "분식", status: "assigned", assignee: "크루 A (예시)" },
  { id: 3, name: "망원 할머니 국물떡볶이", address: "서울 마포구 망원동 (예시)", kind: "분식", status: "duplicate", match: "mangwon-soup" },
  { id: 4, name: "□□김밥 (후보 예시)", address: "서울 서대문구 연희동 (예시)", kind: "김밥", status: "skip" },
  { id: 5, name: "◇◇포차 (후보 예시)", address: "서울 서대문구 창천동 (예시)", kind: "호프·통닭", status: "new" },
  { id: 6, name: "☆☆즉석떡볶이 (후보 예시)", address: "서울 마포구 상수동 (예시)", kind: "분식", status: "confirmed", assignee: "크루 A (예시)" },
];

// 운영 규칙 (기획안 7절). 처음엔 코드 상수, 나중에 설정 화면에서 바꾼다.
export const RULES = [
  { key: "daily_limit", label: "익명 제보 하루 한도", value: "기기·IP 기준 10건", note: "넘으면 자동 차단, 어드민에 알림" },
  { key: "agree", label: "가격·맵기 수정 반영", value: "다른 기기 2곳 동의", note: "어드민은 사후 감시 · 막기 가능" },
  { key: "same", label: "우선 검토", value: "같은 내용 3건", note: "승인함 맨 위로" },
  { key: "stale", label: "흐린 도장", value: "마지막 확인 180일", note: "신선도 점검 목록에 올라옴" },
  { key: "expire", label: "목록·지도에서 내림", value: "마지막 확인 365일", note: "자동. 확인하면 다시 올라감" },
  { key: "near", label: "「아직 있어요」 거리", value: "가게 200m 안", note: "서버가 거리 확인" },
] as const;

export function hoursSince(at: string, now = SAMPLE_NOW) {
  return Math.floor((new Date(now).getTime() - new Date(at.replace(" ", "T") + ":00+09:00").getTime()) / 3_600_000);
}

export function ageText(at: string) {
  const h = hoursSince(at);
  if (h < 1) return "방금";
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}
