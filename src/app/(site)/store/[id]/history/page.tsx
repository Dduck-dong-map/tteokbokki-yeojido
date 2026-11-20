import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { BackHeader } from "@/components/layout";
import { buttonVariants } from "@/components/ui/button";
import { getHistory, getStore } from "@/lib/data";
import type { HistoryKind } from "@/lib/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "변경 이력", robots: { index: false } };

const KIND: Record<HistoryKind, string> = {
  new: "처음 등록했어요",
  edit: "정보를 고쳤어요",
  still: "「아직 있어요」를 눌렀어요",
  verified: "「맞아요」 3명으로 확인이 끝났어요",
  hidden: "의견이 쌓여 지도에서 내렸어요",
  closed: "문을 닫았다는 신고가 쌓여 지도에서 내렸어요",
};

// 소개글처럼 긴 글은 앞부분만 보인다. 저장된 값은 그대로 다 남는다.
const short = (v: string) => (v.length > 60 ? `${v.slice(0, 60)}…` : v);

const when = (iso: string) => new Date(iso).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul", month: "long", day: "numeric" });

// 변경 이력: 누가 언제 무엇을 바꿨는지 누구나 본다. 잘못 고쳐졌으면 누구나 다시 고칠 수 있다.
export default function HistoryPage({ params }: PageProps<"/store/[id]/history">) {
  return (
    <div className="page-narrow pb-10">
      <Suspense fallback={<BackHeader title="변경 이력" />}>
        <Loader params={params} />
      </Suspense>
    </div>
  );
}

async function Loader({ params }: Pick<PageProps<"/store/[id]/history">, "params">) {
  await connection();
  const { id } = await params;
  const [store, items] = await Promise.all([getStore(id), getHistory(id)]);
  if (!store) notFound();
  return (
    <>
      <BackHeader title="변경 이력" href={`/store/${id}`} />
      <p className="px-4 pt-4 text-body-small font-bold md:px-0 md:pt-0 break-keep [overflow-wrap:anywhere]">{store.name}</p>
      {items.length ? (
        // 폰은 좌우 꽉 찬 줄 목록, 768 이상은 둥근 카드 한 장
        <ol className="mt-2 divide-y divide-border border-y border-border bg-card md:rounded-2xl md:border">
          {items.map((h) => (
            <li key={h.id} className="px-4 py-3">
              <p className="flex items-baseline justify-between gap-2 text-caption text-muted-foreground/70">
                <b className="min-w-0 truncate font-semibold text-muted-foreground">{h.who}</b>
                <span className="shrink-0">{when(h.at)}</span>
              </p>
              <p className="mt-0.5 text-body-small break-keep [overflow-wrap:anywhere]">{KIND[h.kind]}</p>
              {h.changes?.map((c) => (
                <p key={c.field} className="mt-1 text-body-small text-muted-foreground break-keep [overflow-wrap:anywhere]">
                  <span className="text-muted-foreground/70">{c.field}</span> {short(c.from)} → <b>{short(c.to)}</b>
                </p>
              ))}
            </li>
          ))}
        </ol>
      ) : (
        <p className="px-4 py-10 text-center text-body-small text-muted-foreground/70">아직 바뀐 적이 없어요.</p>
      )}
      <div className="px-4 pt-4 md:px-0">
        <Link href={`/store/${id}/edit`} className={cn(buttonVariants({ variant: "outlined", size: "md" }), "flex w-full min-w-0 px-3")}>
          잘못된 곳이 있으면 고치기
        </Link>
      </div>
    </>
  );
}
