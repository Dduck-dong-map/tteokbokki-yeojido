"use client";

import Link from "next/link";
import { useState } from "react";
import { VerifyButtons } from "@/components/store/StoreActions";
import { distanceM, distanceText, won } from "@/lib/filters";
import { confirmedAgo } from "@/lib/freshness";
import { useGrantedLocation } from "@/lib/screen";
import type { Store } from "@/lib/types";
import { HIDE_AT, VERIFY_YES, isPending, updateReasons } from "@/lib/wiki";
import { BottomNav, GRID_LI, GRID_UL, SampleRibbon, SpiceStamp, StoreThumb } from "../ui";

type Tab = "new" | "update";

// 함께 고치기: ① 새로 온 가게를 확인하고 ② 오래됐거나 비어 있는 정보를 채운다.
// 포인트 같은 보상은 넣지 않았다 (MVP). 내 등록은 내 맛지도에 모인다.
export default function TogetherPage({ stores, sample, nowIso }: { stores: Store[]; sample: boolean; nowIso: string }) {
  const [tab, setTab] = useState<Tab>("new");
  const me = useGrantedLocation();
  const now = new Date(nowIso);

  const near = (a: Store, b: Store) => (me ? distanceM(me, a) - distanceM(me, b) : 0);
  const fresh = stores.filter((s) => isPending(s, now)).sort((a, b) => (me ? near(a, b) : (b.createdAt ?? "").localeCompare(a.createdAt ?? "")));
  const todo = stores
    .filter((s) => !isPending(s, now))
    .map((s) => ({ s, why: updateReasons(s, now) }))
    .filter((x) => x.why.length)
    .sort((a, b) => (me ? near(a.s, b.s) : a.s.lastConfirmedAt.localeCompare(b.s.lastConfirmedAt)));

  return (
    <div className="page-wide">
      <header className="z-10 border-b border-line bg-bar px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-3 max-md:sticky max-md:top-0 md:border-0 md:bg-transparent md:px-0 md:pt-5">
        <h1 className="text-[18px] font-bold md:text-[20px]">함께 고치기</h1>
        <p className="mt-0.5 text-[12px] text-ink3">이 지도는 먹어 본 사람들이 같이 만들어요 · 가입 없이</p>
      </header>
      {sample && (
        <div className="flex justify-center pt-3">
          <SampleRibbon />
        </div>
      )}

      <main className="flex-1 px-4 pt-3 pb-6 md:px-0">
        <div className="flex gap-2 md:max-w-[480px]">
          {(
            [
              ["new", "새로 온 가게", fresh.length],
              ["update", "확인이 필요해요", todo.length],
            ] as const
          ).map(([key, label, n]) => (
            <button key={key} type="button" onClick={() => setTab(key)} aria-pressed={tab === key} className={`flex-1 rounded-xl border py-2.5 text-center ${tab === key ? "border-ink bg-surface" : "border-line bg-paper"}`}>
              <span className="block font-serif text-[22px] leading-none">{n}</span>
              <span className="mt-1 block text-[12px] text-ink3">{label}</span>
            </button>
          ))}
        </div>

        {tab === "new" ? (
          <>
            <p className="mt-3 text-[13px] leading-relaxed text-ink2">
              새 가게는 바로 지도에 올라가요. 가 보신 곳이면 알려 주세요. 「맞아요」 {VERIFY_YES}명이면 확인이 끝나고, 「달라요」 {HIDE_AT}명이면 내려요.
            </p>
            {fresh.length ? (
              <ul className={`mt-2 ${GRID_UL}`}>
                {fresh.map((s) => (
                  <li key={s.id} className={`py-3 md:p-3 ${GRID_LI}`}>
                    <Link href={`/store/${s.id}`} className="flex gap-3">
                      <StoreThumb photo={s.photos?.[0]} />
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-[15px] font-bold">{s.name}</h3>
                        <p className="truncate text-[12px] text-ink3">
                          {s.dong}
                          {me && <> · {distanceText(distanceM(me, s))}</>} · {s.by} · {confirmedAgo(s.createdAt!, now)}
                        </p>
                        <p className="mt-0.5 text-[13px] text-ink2">
                          {s.menu[0].name} <b>{won(s.price)}</b>
                        </p>
                        <p className="mt-0.5 text-[12px] text-ink3">
                          맞아요 {s.verify?.yes ?? 0} · 달라요 {s.verify?.no ?? 0}
                        </p>
                      </div>
                      <SpiceStamp n={s.spice} size={26} />
                    </Link>
                    <div className="mt-2">
                      <VerifyButtons id={s.id} compact />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-10 text-center text-[13px] leading-relaxed text-ink3">
                지금은 확인할 새 가게가 없어요.
                <br />
                아는 집이 있으면 하나 알려 주세요.
              </p>
            )}
          </>
        ) : (
          <>
            <p className="mt-3 text-[13px] leading-relaxed text-ink2">오래됐거나 비어 있는 가게예요. 지나가다 보시면 사진 한 장, 가격 한 줄만 고쳐 주세요.</p>
            {todo.length ? (
              <ul className={`mt-2 ${GRID_UL}`}>
                {todo.map(({ s, why }) => (
                  <li key={s.id} className={`flex items-center gap-3 py-3 md:p-3 ${GRID_LI}`}>
                    <Link href={`/store/${s.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                      <StoreThumb photo={s.photos?.[0]} />
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-[15px] font-bold">{s.name}</h3>
                        <p className="truncate text-[12px] text-ink3">
                          {s.dong}
                          {me && <> · {distanceText(distanceM(me, s))}</>}
                        </p>
                        <p className="mt-1 flex flex-wrap gap-1">
                          {why.map((w) => (
                            <span key={w} className="rounded-full bg-chip px-2 text-[11px] leading-5 text-ink2">
                              {w}
                            </span>
                          ))}
                        </p>
                      </div>
                    </Link>
                    <Link href={`/store/${s.id}/edit`} className="grid h-11 shrink-0 place-items-center rounded-xl border border-ink2 bg-surface px-3 text-[13px] font-bold md:h-9">
                      고치기
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-10 text-center text-[13px] text-ink3">지금은 손볼 가게가 없어요. 고마워요!</p>
            )}
          </>
        )}

        <Link href="/register" className="mt-5 grid h-12 place-items-center rounded-xl bg-accent text-[15px] font-bold text-onaccent md:hidden">
          맛집 등록하기
        </Link>
      </main>

      <div className="sticky bottom-0 md:hidden">
        <BottomNav active="together" />
      </div>
    </div>
  );
}
