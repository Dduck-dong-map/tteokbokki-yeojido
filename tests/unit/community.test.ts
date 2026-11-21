import { describe, expect, it } from "vitest";
import {
  DAILY_COMMENTS,
  DAILY_LISTS,
  DAILY_POSTS,
  MAX_COMMENT,
  MAX_LIST_DESC,
  MAX_LIST_STORES,
  MAX_LIST_TITLE,
  MAX_POST_BODY,
  MAX_POST_PHOTOS,
  MAX_POST_TITLE,
  checkComment,
  checkListInfo,
  checkPost,
  timeAgo,
} from "@/lib/community";

// 떡볶이방 · 맛집 리스트 규칙 (lib/community.ts)

const long = (n: number) => "가".repeat(n);

describe("상수 — 도배 한도는 양수", () => {
  it.each([
    ["DAILY_POSTS", DAILY_POSTS],
    ["DAILY_COMMENTS", DAILY_COMMENTS],
    ["DAILY_LISTS", DAILY_LISTS],
    ["MAX_LIST_STORES", MAX_LIST_STORES],
    ["MAX_POST_TITLE", MAX_POST_TITLE],
    ["MAX_POST_BODY", MAX_POST_BODY],
    ["MAX_COMMENT", MAX_COMMENT],
    ["MAX_LIST_TITLE", MAX_LIST_TITLE],
    ["MAX_LIST_DESC", MAX_LIST_DESC],
  ])("%s > 0", (_name, v) => {
    expect(Number.isInteger(v)).toBe(true);
    expect(v).toBeGreaterThan(0);
  });
});

describe("checkPost", () => {
  const ok = { cat: "free", title: "제목", body: "내용" };
  it("말머리가 없거나 모르는 값이면 먼저 걸린다", () => {
    expect(checkPost({})).toBe("말머리를 골라 주세요");
    expect(checkPost({ ...ok, cat: "etc" })).toBe("말머리를 골라 주세요");
  });
  it("빈 제목 · 최대 길이", () => {
    expect(checkPost({ ...ok, title: "   " })).toBe("제목을 써 주세요");
    expect(checkPost({ ...ok, title: long(MAX_POST_TITLE + 1) })).toBe(`제목은 ${MAX_POST_TITLE}자까지예요`);
    expect(checkPost({ ...ok, title: long(MAX_POST_TITLE) })).toBeNull();
  });
  it("빈 내용 · 최대 길이", () => {
    expect(checkPost({ ...ok, body: "" })).toBe("내용을 써 주세요");
    expect(checkPost({ ...ok, body: long(MAX_POST_BODY + 1) })).toBe(`내용은 ${MAX_POST_BODY}자까지예요`);
    expect(checkPost({ ...ok, body: long(MAX_POST_BODY) })).toBeNull();
  });
  it("붙인 가게는 문자열이거나 없어야 한다", () => {
    expect(checkPost({ ...ok, storeId: 3 })).toBe("가게를 다시 골라 주세요");
    expect(checkPost({ ...ok, storeId: null })).toBeNull();
    expect(checkPost({ ...ok, storeId: "mangwon-soup" })).toBeNull();
  });
  it("사진은 없어도 되고, 있으면 글자 id 배열 · 최대 장수 (11-21)", () => {
    const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
    expect(checkPost({ ...ok, photos: [] })).toBeNull();
    expect(checkPost({ ...ok, photos: null })).toBeNull();
    expect(checkPost({ ...ok, photos: [id(1), id(2)] })).toBeNull();
    expect(checkPost({ ...ok, photos: "abc" })).toBe("사진을 다시 올려 주세요");
    expect(checkPost({ ...ok, photos: [1] })).toBe("사진을 다시 올려 주세요");
    expect(checkPost({ ...ok, photos: Array.from({ length: MAX_POST_PHOTOS }, (_, i) => id(i)) })).toBeNull();
    expect(checkPost({ ...ok, photos: Array.from({ length: MAX_POST_PHOTOS + 1 }, (_, i) => id(i)) })).toBe(`사진은 ${MAX_POST_PHOTOS}장까지 올릴 수 있어요`);
  });
});

describe("checkComment", () => {
  it("빈 댓글(공백만 포함) · 최대 길이", () => {
    expect(checkComment("")).toBe("댓글을 써 주세요");
    expect(checkComment("   ")).toBe("댓글을 써 주세요");
    expect(checkComment(123)).toBe("댓글을 써 주세요");
    expect(checkComment(long(MAX_COMMENT + 1))).toBe(`댓글은 ${MAX_COMMENT}자까지예요`);
    expect(checkComment(long(MAX_COMMENT))).toBeNull();
  });
});

describe("checkListInfo", () => {
  it("새로 만들 때 이름은 필수", () => {
    expect(checkListInfo({})).toBe("리스트 이름을 써 주세요");
    expect(checkListInfo({ title: " " })).toBe("리스트 이름을 써 주세요");
    expect(checkListInfo({ title: long(MAX_LIST_TITLE + 1) })).toBe(`이름은 ${MAX_LIST_TITLE}자까지예요`);
    expect(checkListInfo({ title: long(MAX_LIST_TITLE) })).toBeNull();
  });
  it("설명·공개 범위", () => {
    expect(checkListInfo({ title: "a", desc: long(MAX_LIST_DESC + 1) })).toBe(`설명은 ${MAX_LIST_DESC}자까지예요`);
    expect(checkListInfo({ title: "a", desc: 1 })).toBe("설명을 다시 써 주세요");
    expect(checkListInfo({ title: "a", desc: null })).toBeNull();
    expect(checkListInfo({ title: "a", visibility: "secret" })).toBe("공개 범위를 골라 주세요");
    expect(checkListInfo({ title: "a", visibility: "link" })).toBeNull();
  });
  it("partial(고치기)이면 이름을 안 보내도 되지만, 보내면 비면 안 된다", () => {
    expect(checkListInfo({}, true)).toBeNull();
    expect(checkListInfo({ visibility: "public" }, true)).toBeNull();
    expect(checkListInfo({ title: "" }, true)).toBe("리스트 이름을 써 주세요");
  });
});

describe("timeAgo", () => {
  const now = new Date("2026-11-09T12:00:00+09:00");
  const ago = (sec: number) => new Date(now.getTime() - sec * 1000).toISOString();
  it("방금 · 분 · 시간 · 일 · 날짜", () => {
    expect(timeAgo(ago(10), now)).toBe("방금");
    expect(timeAgo(ago(12 * 60), now)).toBe("12분 전");
    expect(timeAgo(ago(3 * 3600), now)).toBe("3시간 전");
    expect(timeAgo(ago(2 * 86_400), now)).toBe("2일 전");
    expect(timeAgo(ago(8 * 86_400), now)).toBe("11월 1일");
  });
});
