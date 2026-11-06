import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { BackHeader } from "@/components/ui";
import { getHistory, getStore } from "@/lib/data";
import type { HistoryKind } from "@/lib/types";

export const metadata: Metadata = { title: "변경 이력", robots: { index: false } };

const KIND: Record<HistoryKind, string> = {
  new: "처음 제보했어요",
  edit: "정보를 고쳤어요",
  still: "「아직 있어요」를 눌렀어요",
  verified: "「맞아요」 3명으로 확인이 끝났어요",
  hidden: "의견이 쌓여 지도에서 내렸어요",
  closed: "문을 닫았다는 신고가 쌓여 지도에서 내렸어요",
};

const when = (iso: string) => new Date(iso).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul", month: "long", day: "numeric" });

// 변경 이력: 누가 언제 무엇을 바꿨는지 누구나 본다. 잘못 고쳐졌으면 누구나 다시 고칠 수 있다.
export default function HistoryPage({ params }: PageProps<"/store/[id]/history">) {
  return (
    <div className="mx-auto min-h-dvh max-w-[480px] bg-paper pb-10">
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
      <p className="px-4 pt-4 text-[14px] font-bold">{store.name}</p>
      {items.length ? (
        <ol className="mt-2 divide-y divide-line border-y border-line bg-surface">
          {items.map((h) => (
            <li key={h.id} className="px-4 py-3">
              <p className="flex items-baseline justify-between gap-2 text-[12px] text-ink3">
                <b className="font-semibold text-ink2">{h.who}</b>
                <span className="shrink-0">{when(h.at)}</span>
              </p>
              <p className="mt-0.5 text-[14px]">{KIND[h.kind]}</p>
              {h.changes?.map((c) => (
                <p key={c.field} className="mt-1 text-[13px] text-ink2">
                  <span className="text-ink3">{c.field}</span> {c.from} → <b>{c.to}</b>
                </p>
              ))}
            </li>
          ))}
        </ol>
      ) : (
        <p className="px-4 py-10 text-center text-[14px] text-ink3">아직 바뀐 적이 없어요.</p>
      )}
      <div className="px-4 pt-4">
        <Link href={`/store/${id}/edit`} className="grid h-11 place-items-center rounded-xl border border-chipline bg-surface text-[14px] font-bold">
          잘못된 곳이 있으면 고치기
        </Link>
      </div>
    </>
  );
}
