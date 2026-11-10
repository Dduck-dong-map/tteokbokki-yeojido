"use client";

import { useState } from "react";
import type { Post } from "@/lib/community";
import RoomBoardView from "./RoomBoardView";
import type { BoardCatFilter } from "./types";

// 떡볶이방 글 목록 컨테이너 (리팩토링 계획 2026-11-09 · 7-1 형태 2).
// 여기서는 말머리 상태·거르기·기준 시각·예시 여부만 계산하고, 마크업은 RoomBoardView 가 맡는다(계약: ./types.ts).
// 서버 페이지가 { posts, storeNames, nowIso } 로 그대로 부르므로 props 는 바꾸지 않는다.
export default function RoomBoard({ posts, storeNames, nowIso }: { posts: Post[]; storeNames: Record<string, string>; nowIso: string }) {
  const [cat, setCat] = useState<BoardCatFilter>("all");
  const now = new Date(nowIso);
  const shown = cat === "all" ? posts : posts.filter((p) => p.cat === cat);
  const sample = posts.some((p) => p.isSample);

  return <RoomBoardView posts={shown} cat={cat} storeNames={storeNames} now={now} sample={sample} onCatChange={setCat} />;
}
