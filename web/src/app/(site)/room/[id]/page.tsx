import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { LikeButton } from "@/components/lists/ListParts";
import { Comments, PostActions } from "@/components/room/PostParts";
import { BackHeader, SampleRibbon, SpiceStamp } from "@/components/ui";
import { BOARD_CATS, timeAgo } from "@/lib/community";
import { getPost, getStore } from "@/lib/data";
import { won } from "@/lib/filters";

export async function generateMetadata({ params }: PageProps<"/room/[id]">): Promise<Metadata> {
  "use cache";
  const found = await getPost((await params).id);
  return found ? { title: `${found.post.title} · 떡볶이방`, description: found.post.body.slice(0, 80) } : {};
}

// 떡볶이방 글 하나: 말머리 · 제목 · 닉네임/시각 → 내용 → 붙인 가게 → 지우기·신고 → 댓글
export default function PostPage({ params }: PageProps<"/room/[id]">) {
  return (
    <div className="page-narrow">
      <BackHeader title="떡볶이방" href="/room" />
      <Suspense fallback={<div className="flex-1" />}>
        <Loader params={params} />
      </Suspense>
    </div>
  );
}

async function Loader({ params }: Pick<PageProps<"/room/[id]">, "params">) {
  await connection();
  const found = await getPost((await params).id);
  if (!found) notFound();
  const { post, comments } = found;
  const store = post.storeId ? await getStore(post.storeId) : undefined;
  const now = new Date();

  return (
    <main className="flex flex-1 flex-col gap-4 px-4 pt-3 pb-10 md:px-0">
      {post.isSample && (
        <div className="flex justify-center">
          <SampleRibbon />
        </div>
      )}
      <article className="flex flex-col gap-3">
        <header>
          <span className="rounded border border-chipline px-1.5 text-[11px] leading-5 text-ink2">{BOARD_CATS[post.cat]}</span>
          <h1 className="mt-1.5 text-[20px] leading-snug font-bold text-balance">{post.title}</h1>
          <p className="mt-1 text-[12px] text-ink3">
            {post.who} · {timeAgo(post.at, now)}
          </p>
        </header>
        <p className="border-t border-line pt-3 text-[15px] leading-relaxed whitespace-pre-line">{post.body}</p>
        {store && (
          <Link href={`/store/${store.id}`} className="flex items-center gap-3 rounded-xl border border-line bg-surface px-3 py-2.5 hover:bg-chip/60">
            <SpiceStamp n={store.spice} size={26} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-bold">{store.name}</span>
              <span className="block text-[12px] text-ink3">
                {store.dong} · {store.menu[0].name} {won(store.price)}
              </span>
            </span>
            <span className="shrink-0 text-[13px] text-ink3">가게 보기 ›</span>
          </Link>
        )}
        {/* 추천(엄지척) + 숫자 (11-08) */}
        <div className="flex justify-center py-1">
          <LikeButton id={post.id} likes={post.likes} kind="post" />
        </div>
        <PostActions id={post.id} />
      </article>

      <Comments postId={post.id} comments={comments} nowIso={now.toISOString()} />
    </main>
  );
}
