import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import PostForm from "@/components/room/PostForm";
import { BackHeader } from "@/components/layout";
import { getStores } from "@/lib/data";

export const metadata: Metadata = { title: "글쓰기 · 떡볶이방", robots: { index: false } };

export default function WritePage() {
  return (
    <div className="page-narrow">
      <BackHeader title="떡볶이방 글쓰기" href="/room" />
      <Suspense fallback={<div className="flex-1" />}>
        <Loader />
      </Suspense>
    </div>
  );
}

async function Loader() {
  await connection();
  const stores = (await getStores()).map(({ id, name, dong }) => ({ id, name, dong }));
  return <PostForm stores={stores} />;
}
