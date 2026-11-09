import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import RoomBoard from "@/components/room/RoomBoard";
import { BottomNav } from "@/components/layout";
import { getPosts, getStores } from "@/lib/data";

export const metadata: Metadata = { title: "떡볶이방" };

// 메뉴 「떡볶이방」: 게시판 (11-08 사용자 지시). 말머리 셋(자유 · 맛집 추천 · 같이 가요), 가입 없이 닉네임으로 쓴다.
export default function RoomPage() {
  return (
    <div className="page-wide">
      <Suspense fallback={<div className="flex-1" />}>
        <Loader />
      </Suspense>
      <div className="sticky bottom-0 md:hidden">
        <BottomNav active="room" />
      </div>
    </div>
  );
}

async function Loader() {
  await connection(); // 새 글이 바로 보여야 한다
  const [posts, stores] = await Promise.all([getPosts(), getStores()]);
  const names = Object.fromEntries(stores.map((s) => [s.id, s.name]));
  return <RoomBoard posts={posts} storeNames={names} nowIso={new Date().toISOString()} />;
}
