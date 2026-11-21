// 떡볶이방(게시판) · 맛집 리스트(내 맛지도) 공용 규칙 (11-08 사용자 지시).
// 화면과 서버가 같이 쓴다. 저장은 data/db.ts, 화면에 내보내는 값은 아래 타입만.

import { MAX_PHOTOS } from "./wiki";

// ───────── 떡볶이방 게시판 ─────────

export const BOARD_CATS = { free: "자유", recommend: "맛집 추천", together: "같이 가요" } as const;
export type BoardCat = keyof typeof BOARD_CATS;

export const MAX_POST_TITLE = 60;
export const MAX_POST_BODY = 2000;
export const MAX_COMMENT = 300;
export const MAX_POST_PHOTOS = MAX_PHOTOS; // 글 사진 (11-21 개발자 제안). 고르기 칸(PhotoPicker)이 가게 사진과 같은 수로 막는다
export const DAILY_POSTS = 20; // 기기·접속 위치 기준 하루 글 수
export const DAILY_COMMENTS = 60;
// 같은 접속 위치(IP) 전체의 하루 상한. 기기 표시만 바꿔 한도를 넘는 것을 막는다 (11-18).
// 상한은 한 사람 한도보다 커야 한다(혼자 쓰는 사람이 먼저 막히지 않게). 댓글은 한 사람 60 → 한 곳 150.
export const DAILY_POSTS_PER_IP = 50;
export const DAILY_COMMENTS_PER_IP = 150;

export type Post = {
  id: string;
  at: string; // ISO
  who: string; // 닉네임
  cat: BoardCat;
  title: string;
  body: string;
  storeId?: string; // 글에 붙인 가게 (선택)
  photos?: string[]; // 글 사진 id (선택 · /api/photos/<id>, 11-21)
  comments: number;
  likes: number; // 추천(엄지척) 수
};

export type PostComment = { id: string; at: string; who: string; text: string };

export function checkPost(p: { cat?: unknown; title?: unknown; body?: unknown; storeId?: unknown; photos?: unknown }): string | null {
  if (typeof p.cat !== "string" || !(p.cat in BOARD_CATS)) return "말머리를 골라 주세요";
  if (typeof p.title !== "string" || !p.title.trim()) return "제목을 써 주세요";
  if (p.title.trim().length > MAX_POST_TITLE) return `제목은 ${MAX_POST_TITLE}자까지예요`;
  if (typeof p.body !== "string" || !p.body.trim()) return "내용을 써 주세요";
  if (p.body.trim().length > MAX_POST_BODY) return `내용은 ${MAX_POST_BODY}자까지예요`;
  if (p.storeId !== undefined && p.storeId !== null && typeof p.storeId !== "string") return "가게를 다시 골라 주세요";
  if (p.photos !== undefined && p.photos !== null) {
    if (!Array.isArray(p.photos) || p.photos.some((x) => typeof x !== "string")) return "사진을 다시 올려 주세요";
    if (p.photos.length > MAX_POST_PHOTOS) return `사진은 ${MAX_POST_PHOTOS}장까지 올릴 수 있어요`;
  }
  return null;
}

export function checkComment(text: unknown): string | null {
  if (typeof text !== "string" || !text.trim()) return "댓글을 써 주세요";
  if (text.trim().length > MAX_COMMENT) return `댓글은 ${MAX_COMMENT}자까지예요`;
  return null;
}

// ───────── 맛집 리스트 ─────────
// 내가 고른 가게들을 묶은 리스트. 공개하면 「모두의 리스트」에 보이고, 다른 사람이 추천할 수 있다.

export const LIST_VISIBILITY = { public: "모두에게 공개", link: "링크로만 공유" } as const;
export type ListVisibility = keyof typeof LIST_VISIBILITY;

export const MAX_LIST_TITLE = 40;
export const MAX_LIST_DESC = 200;
export const MAX_LIST_STORES = 50;
export const DAILY_LISTS = 20;
export const DAILY_LISTS_PER_IP = 50; // 같은 접속 위치(IP) 전체의 하루 상한 (11-18)

export type PlaceList = {
  id: string;
  title: string;
  desc?: string;
  storeIds: string[]; // 순서가 곧 리스트 순서
  who: string; // 만든 사람 닉네임
  createdAt: string; // ISO
  updatedAt: string; // ISO
  visibility: ListVisibility;
  likes: number; // 추천 수
};

export function checkListInfo(p: { title?: unknown; desc?: unknown; visibility?: unknown }, partial = false): string | null {
  if (!partial || p.title !== undefined) {
    if (typeof p.title !== "string" || !p.title.trim()) return "리스트 이름을 써 주세요";
    if (p.title.trim().length > MAX_LIST_TITLE) return `이름은 ${MAX_LIST_TITLE}자까지예요`;
  }
  if (p.desc !== undefined && p.desc !== null) {
    if (typeof p.desc !== "string") return "설명을 다시 써 주세요";
    if (p.desc.trim().length > MAX_LIST_DESC) return `설명은 ${MAX_LIST_DESC}자까지예요`;
  }
  if (p.visibility !== undefined && (typeof p.visibility !== "string" || !(p.visibility in LIST_VISIBILITY))) return "공개 범위를 골라 주세요";
  return null;
}

// 글·댓글 시각: 방금 · 12분 전 · 3시간 전 · 2일 전 · 11월 2일
export function timeAgo(iso: string, now: Date) {
  const s = Math.max(0, (now.getTime() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "방금";
  if (s < 3600) return `${Math.floor(s / 60)}분 전`;
  if (s < 86_400) return `${Math.floor(s / 3600)}시간 전`;
  if (s < 7 * 86_400) return `${Math.floor(s / 86_400)}일 전`;
  const d = new Date(new Date(iso).getTime() + 9 * 3_600_000);
  return `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일`;
}

// 내가 가진 것: 화면에서 「내 글이면 지우기」「내 리스트면 고치기」「이미 추천함」을 가르는 데 쓴다
// liked = 추천한 리스트, likedPosts = 추천한 글
export type Owned = { lists: PlaceList[]; posts: string[]; comments: string[]; liked: string[]; likedPosts: string[] };
