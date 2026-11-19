import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { LikeButton } from "@/components/lists/ListParts";
import { Comments, PostActions } from "@/components/room/PostParts";
import { SampleRibbon, SpiceStamp } from "@/components/brand";
import { BackHeader } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { BOARD_CATS, timeAgo } from "@/lib/community";
import { getPost, getStore } from "@/lib/data";
import { won } from "@/lib/filters";
import { cn } from "@/lib/utils";

export async function generateMetadata({ params }: PageProps<"/room/[id]">): Promise<Metadata> {
  "use cache";
  const found = await getPost((await params).id);
  return found ? { title: `${found.post.title} · 떡볶이방`, description: found.post.body.slice(0, 80) } : {};
}

// 떡볶이방 글 하나: 말머리 · 제목 · 닉네임/시각 → 내용 → 붙인 가게 → 추천 → 지우기·신고 → 댓글
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
  await connection(); // 새 댓글·추천이 바로 보여야 한다
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
          <Badge variant="outline" className="rounded-full border-transparent bg-muted px-2 text-caption font-normal text-muted-foreground">
            {BOARD_CATS[post.cat]}
          </Badge>
          <h1 className="mt-1.5 text-heading-4 text-balance break-keep [overflow-wrap:anywhere]">{post.title}</h1>
          <p className="mt-1 text-caption text-muted-foreground/70">
            {post.who} · {timeAgo(post.at, now)}
          </p>
        </header>
        <p className="border-t border-border pt-3 text-body-medium whitespace-pre-line break-keep [overflow-wrap:anywhere]">{post.body}</p>
        {store && (
          // 붙인 가게 카드: 도장 · 이름 · 동 · 대표 메뉴 가격 → 가게 상세
          <Link
            href={`/store/${store.id}`}
            className={cn("flex min-h-11 items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5 hover:bg-muted")}
          >
            <SpiceStamp n={store.spice} size={26} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-caption font-bold text-foreground">{store.name}</span>
              <span className="block truncate text-caption text-muted-foreground/70">
                {store.dong} · {store.menu[0].name} {won(store.price)}
              </span>
            </span>
            <span className="inline-flex shrink-0 items-center text-caption text-muted-foreground/70">
              가게 보기
              <ChevronRight className="size-4" strokeWidth={2} aria-hidden="true" />
            </span>
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
