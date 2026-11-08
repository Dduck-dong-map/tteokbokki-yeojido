"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { type PlaceList } from "@/lib/community";
import { distanceM, distanceText } from "@/lib/filters";
import { confirmedAgo, freshness } from "@/lib/freshness";
import { send } from "@/lib/me";
import { toggleSave, toggleVisited, useMine, type SavedStore } from "@/lib/mine";
import { refreshOwned, useOwned } from "@/lib/owned";
import { useGrantedLocation } from "@/lib/screen";
import { RICE_CAKES, STYLES } from "@/lib/taxonomy";
import type { Store } from "@/lib/types";
import { ListCard } from "../lists/ListParts";
import { ListInfoForm } from "../lists/ListView";
import { BottomNav, GRID_LI, GRID_UL, SampleRibbon, SpiceStamp } from "../ui";

// 내 맛지도 (11-08 사용자 지시): 가게를 모아 「맛집 리스트」를 만들고, 공개해서 서로 나누고 추천한다.
// 탭: 내 리스트 · 모두의 리스트(추천순/최신순) · 찜한 가게(♡) · 내 등록
export type MineTab = "my" | "all" | "saved" | "reports";
const TABS: { key: MineTab; label: string }[] = [
  { key: "my", label: "내 리스트" },
  { key: "all", label: "모두의 리스트" },
  { key: "saved", label: "찜한 가게" },
  { key: "reports", label: "내 등록" },
];
const KIND = { new: "새 가게", edit: "정보 수정", closed: "문 닫음" } as const;

export default function MinePage({ stores, lists, sample, nowIso, initialTab }: { stores: Store[]; lists: PlaceList[]; sample: boolean; nowIso: string; initialTab: MineTab }) {
  const router = useRouter();
  const mine = useMine();
  const owned = useOwned();
  const [tab, setTab] = useState<MineTab>(initialTab);
  const [sort, setSort] = useState<"likes" | "new">("likes");
  const [creating, setCreating] = useState(false);
  const [onlyVisited, setOnlyVisited] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const me = useGrantedLocation();
  const now = new Date(nowIso);
  const byId = new Map(stores.map((s) => [s.id, s]));

  // 찜한 가게: 위치가 있으면 가까운순, 없으면 최근 저장순
  const saved: { s: Store; v: SavedStore }[] = [];
  for (const [id, v] of Object.entries(mine.saved)) {
    const s = byId.get(id);
    if (s) saved.push({ s, v });
  }
  if (me) saved.sort((a, b) => distanceM(me, a.s) - distanceM(me, b.s));
  else saved.sort((a, b) => b.v.at.localeCompare(a.v.at));
  const savedShown = onlyVisited ? saved.filter((x) => x.v.visited) : saved;

  const allLists = [...lists].sort((a, b) => (sort === "likes" ? b.likes - a.likes || b.updatedAt.localeCompare(a.updatedAt) : b.updatedAt.localeCompare(a.updatedAt)));
  const counts: Record<MineTab, number> = { my: owned.data.lists.length, all: lists.length, saved: saved.length, reports: mine.reports.length };

  const createList = async (v: { title: string; desc: string; visibility: PlaceList["visibility"] }, storeIds: string[] = []) => {
    const res = await send("/api/lists", { ...v, storeIds });
    if (!res.ok || !res.id) return setMsg(res.error ?? "만들지 못했어요");
    void refreshOwned();
    router.push(`/lists/${res.id}`);
  };

  const empty = (children: React.ReactNode) => <div className="mt-10 text-center text-[13px] leading-relaxed text-ink3">{children}</div>;

  return (
    <div className="page-wide">
      <header className="z-10 border-b border-line bg-bar px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-3 max-md:sticky max-md:top-0 md:border-0 md:bg-transparent md:px-0 md:pt-5">
        <div className="flex items-baseline gap-2">
          <h1 className="text-[18px] font-bold md:text-[20px]">내 맛지도</h1>
          <span className="text-[12px] text-ink3">가게를 모아 리스트로 · 나누고 추천받기</span>
        </div>
        <div className="mt-3 flex gap-1.5 overflow-x-auto [scrollbar-width:none]" role="tablist" aria-label="내 맛지도">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => {
                setTab(t.key);
                setMsg(null);
                window.history.replaceState(null, "", `/mine?tab=${t.key}`);
              }}
              className={`h-9 shrink-0 rounded-full border px-3.5 text-[13px] ${tab === t.key ? "border-ink bg-ink font-semibold text-paper" : "border-chipline bg-surface text-ink2"}`}
            >
              {t.label} <span className="tabular-nums opacity-70">{counts[t.key]}</span>
            </button>
          ))}
        </div>
      </header>
      {sample && (
        <div className="flex justify-center pt-3">
          <SampleRibbon />
        </div>
      )}

      <main className="flex-1 px-4 pt-3 pb-6 md:px-0">
        {msg && (
          <p role="alert" className="mb-3 rounded-xl bg-spicybg px-3 py-2 text-[13px] text-spicytext">
            {msg}
          </p>
        )}

        {tab === "my" && (
          <>
            {creating ? (
              <div className="md:max-w-[520px]">
                <ListInfoForm submitLabel="만들기" onCancel={() => setCreating(false)} onSave={(v) => createList(v)} />
              </div>
            ) : (
              <button type="button" onClick={() => setCreating(true)} className="grid h-12 w-full place-items-center rounded-xl border border-dashed border-chipline bg-surface text-[14px] font-bold text-ink md:max-w-[520px]">
                ＋ 새 리스트 만들기
              </button>
            )}
            {!owned.loaded ? (
              empty("내 리스트를 불러오는 중…")
            ) : owned.data.lists.length ? (
              <ul className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {owned.data.lists.map((l) => (
                  <li key={l.id}>
                    <ListCard list={l} stores={byId} now={now} showVisibility />
                  </li>
                ))}
              </ul>
            ) : (
              empty(
                <>
                  아직 만든 리스트가 없어요.
                  <br />
                  리스트를 만들고 가게를 담으면, 링크로 나누거나 「모두의 리스트」에 올릴 수 있어요.
                </>,
              )
            )}
          </>
        )}

        {tab === "all" && (
          <>
            <div className="flex items-center justify-between text-[13px]">
              <b>공개된 리스트 {lists.length}개</b>
              <span className="flex gap-1">
                {(
                  [
                    ["likes", "추천순"],
                    ["new", "최신순"],
                  ] as const
                ).map(([k, v]) => (
                  <button key={k} type="button" aria-pressed={sort === k} onClick={() => setSort(k)} className={`hit h-7 rounded-full px-2.5 text-[12px] ${sort === k ? "bg-ink font-semibold text-paper" : "text-ink3"}`}>
                    {v}
                  </button>
                ))}
              </span>
            </div>
            {allLists.length ? (
              <ul className="mt-2 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {allLists.map((l) => (
                  <li key={l.id}>
                    <ListCard list={l} stores={byId} now={now} />
                  </li>
                ))}
              </ul>
            ) : (
              empty("아직 공개된 리스트가 없어요. 첫 리스트를 만들어 보세요!")
            )}
          </>
        )}

        {tab === "saved" && (
          <>
            <div className="flex items-center justify-between gap-2 text-[13px]">
              <b>
                찜한 가게 {saved.length}곳 <span className="font-normal text-ink3">· {me ? "가까운순" : "최근 저장순"}</span>
              </b>
              <button type="button" aria-pressed={onlyVisited} onClick={() => setOnlyVisited(!onlyVisited)} className={`hit h-7 rounded-full border px-2.5 text-[12px] ${onlyVisited ? "border-ink bg-surface font-semibold" : "border-chipline text-ink3"}`}>
                다녀온 곳만
              </button>
            </div>
            {saved.length > 0 && (
              <button
                type="button"
                onClick={() => createList({ title: "찜한 떡볶이집", desc: "", visibility: "link" }, saved.map((x) => x.s.id))}
                className="mt-2 grid h-10 w-full place-items-center rounded-xl border border-chipline bg-surface text-[13px] font-bold md:max-w-[520px]"
              >
                찜한 {saved.length}곳으로 리스트 만들기
              </button>
            )}
            {savedShown.length ? (
              <ul className={`mt-1 ${GRID_UL}`}>
                {savedShown.map(({ s, v }) => {
                  const stale = freshness(s, now) === "stale";
                  return (
                    <li key={s.id} className={`flex items-center gap-3 py-3 md:p-3 ${GRID_LI}`}>
                      <Link href={`/store/${s.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                        <SpiceStamp n={s.spice} size={30} faded={stale} />
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-[15px] font-bold">{s.name}</h3>
                          <p className="truncate text-[13px] text-ink2">
                            {s.dong}
                            {me && <> · {distanceText(distanceM(me, s))}</>} · {STYLES[s.style]} · {s.rice.map((r) => RICE_CAKES[r]).join("·")}
                          </p>
                          <p className="text-[11px] text-ink3">
                            찜 {confirmedAgo(v.at, now)}
                            <span className={stale ? " text-spicytext" : ""}> · 확인 {confirmedAgo(s.lastConfirmedAt, now)}</span>
                          </p>
                        </div>
                      </Link>
                      <button
                        type="button"
                        onClick={() => toggleVisited(s.id)}
                        aria-pressed={!!v.visited}
                        className={`hit h-8 shrink-0 rounded-full border px-2.5 text-[12px] ${v.visited ? "border-ink bg-surface font-semibold text-ink" : "border-chipline bg-surface text-ink3"}`}
                      >
                        {v.visited ? "다녀옴 ✓" : "다녀옴"}
                      </button>
                      <button type="button" onClick={() => toggleSave(s.id)} aria-label={`${s.name} 찜 취소`} className="grid h-11 w-11 shrink-0 place-items-center text-[18px] text-fab md:h-8 md:w-8">
                        ♥
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              empty(
                onlyVisited ? (
                  <>찜한 가게 옆 「다녀옴」 을 누르면 여기 모여요.</>
                ) : (
                  <>
                    지도에서 가게를 열고 ♡ 를 누르면 여기 모여요.
                    <br />
                    <Link href="/" className="mt-3 inline-block font-semibold text-ink underline underline-offset-4">
                      지도로 가기
                    </Link>
                  </>
                ),
              )
            )}
          </>
        )}

        {tab === "reports" && (
          <>
            <div className="flex items-center justify-between text-[13px]">
              <b>내가 올린 등록·수정 {mine.reports.length}건</b>
              <span className="text-ink3">최근순</span>
            </div>
            {mine.reports.length ? (
              <ul className={`mt-1 ${GRID_UL}`}>
                {mine.reports.map((r, i) => {
                  const inner = (
                    <>
                      <span className="shrink-0 rounded-full border border-chipline bg-chip px-2 text-[11px] leading-5 text-ink2">{KIND[r.kind]}</span>
                      <span className="min-w-0 flex-1 truncate text-[14px] font-semibold">{r.name}</span>
                      <span className="shrink-0 text-[12px] text-ink3">{confirmedAgo(r.at, now)}</span>
                    </>
                  );
                  return (
                    <li key={i} className={`py-3 md:p-3 ${GRID_LI}`}>
                      {r.storeId ? (
                        <Link href={`/store/${r.storeId}`} className="flex items-center gap-2">
                          {inner}
                        </Link>
                      ) : (
                        <div className="flex items-center gap-2">{inner}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              empty(
                <>
                  아직 올린 가게가 없어요.
                  <br />
                  <Link href="/register" className="mt-3 inline-block font-semibold text-ink underline underline-offset-4">
                    맛집 등록하기
                  </Link>
                </>,
              )
            )}
            <p className="mt-6 text-center text-[12px] text-ink3">등록은 바로 지도에 올라가요 · 이 기기에서 올린 것만 보여요</p>
          </>
        )}
      </main>

      <div className="sticky bottom-0 md:hidden">
        <BottomNav active="mine" />
      </div>
    </div>
  );
}
