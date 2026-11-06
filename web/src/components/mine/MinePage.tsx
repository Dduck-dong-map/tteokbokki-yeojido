"use client";

import Link from "next/link";
import { useState } from "react";
import { distanceM, distanceText } from "@/lib/filters";
import { confirmedAgo, freshness } from "@/lib/freshness";
import { toggleSave, toggleVisited, useMine, type SavedStore } from "@/lib/mine";
import { useGrantedLocation } from "@/lib/screen";
import { RICE_CAKES, STYLES } from "@/lib/taxonomy";
import type { Store } from "@/lib/types";
import { BottomNav, GRID_LI, GRID_UL, SampleRibbon, SpiceStamp } from "../ui";

// 내 맛지도 (보드 N3-05, 11-02): 위 칸 셋(저장 · 다녀옴 · 내 등록) → 저장한 가게 목록.
// 줄 하나 = 도장 + 이름 + 동·거리 + 떡 종류 (정보 순서는 목록과 같다). 누르면 가게 상세.
type Tab = "saved" | "visited" | "reports";
const TABS: { key: Tab; label: string }[] = [
  { key: "saved", label: "저장" },
  { key: "visited", label: "다녀옴" },
  { key: "reports", label: "내 등록" },
];
const KIND = { new: "새 가게", edit: "정보 수정", closed: "문 닫음" } as const;

export default function MinePage({ stores, sample, nowIso }: { stores: Store[]; sample: boolean; nowIso: string }) {
  const mine = useMine();
  const [tab, setTab] = useState<Tab>("saved");
  const me = useGrantedLocation();
  const now = new Date(nowIso); // 「며칠 전」 계산용. 요청 때 서버에서 받는다

  // 저장한 가게 줄: 위치가 있으면 가까운순, 없으면 최근 저장순 (메모이즈는 React 컴파일러가 한다)
  const byId = new Map(stores.map((s) => [s.id, s]));
  const saved: { s: Store; v: SavedStore }[] = [];
  for (const [id, v] of Object.entries(mine.saved)) {
    const s = byId.get(id);
    if (s) saved.push({ s, v });
  }
  if (me) saved.sort((a, b) => distanceM(me, a.s) - distanceM(me, b.s));
  else saved.sort((a, b) => b.v.at.localeCompare(a.v.at));
  const visited = saved.filter((x) => x.v.visited);
  const counts: Record<Tab, number> = { saved: saved.length, visited: visited.length, reports: mine.reports.length };
  const list = tab === "visited" ? visited : saved;

  return (
    <div className="page-wide">
      <header className="z-10 border-b border-line bg-bar px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-3 max-md:sticky max-md:top-0 md:border-0 md:bg-transparent md:px-0 md:pt-5">
        <div className="flex items-baseline gap-2">
          <h1 className="text-[18px] font-bold md:text-[20px]">내 맛지도</h1>
          <span className="text-[12px] text-ink3">이 기기에 저장 · 로그인 없음</span>
        </div>
      </header>
      {sample && (
        <div className="flex justify-center pt-3">
          <SampleRibbon />
        </div>
      )}

      <main className="flex-1 px-4 pb-6 pt-3 md:px-0">
        <div className="flex gap-2 md:max-w-[480px]">
          {TABS.map((t) => {
            const on = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                aria-pressed={on}
                className={`flex-1 rounded-xl border py-2.5 text-center ${on ? "border-ink bg-surface" : "border-line bg-paper"}`}
              >
                <span className="block font-serif text-[22px] leading-none">{counts[t.key]}</span>
                <span className="mt-1 block text-[12px] text-ink3">{t.label}</span>
              </button>
            );
          })}
        </div>

        {tab !== "reports" ? (
          <>
            <div className="mt-4 flex items-center justify-between text-[13px]">
              <b>
                {tab === "saved" ? "저장한 가게" : "다녀온 가게"} {list.length}곳
              </b>
              <span className="text-ink3">{me ? "가까운순" : "최근 저장순"}</span>
            </div>
            {list.length ? (
              <ul className={`mt-1 ${GRID_UL}`}>
                {list.map(({ s, v }) => {
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
                            저장 {confirmedAgo(v.at, now)}
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
                      <button type="button" onClick={() => toggleSave(s.id)} aria-label={`${s.name} 저장 취소`} className="grid h-11 w-11 shrink-0 place-items-center text-[18px] text-fab md:h-8 md:w-8">
                        ♥
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-10 text-center text-[13px] leading-relaxed text-ink3">
                {tab === "saved" ? (
                  <>
                    지도에서 가게를 열고 ♡ 를 누르면 여기 모여요.
                    <br />
                    <Link href="/" className="mt-3 inline-block font-semibold text-ink underline underline-offset-4">
                      지도로 가기
                    </Link>
                  </>
                ) : (
                  <>저장한 가게 옆 「다녀옴」 을 누르면 여기 모여요.</>
                )}
              </p>
            )}
          </>
        ) : (
          <>
            <div className="mt-4 flex items-center justify-between text-[13px]">
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
              <p className="mt-10 text-center text-[13px] leading-relaxed text-ink3">
                아직 올린 가게가 없어요.
                <br />
                <Link href="/register" className="mt-3 inline-block font-semibold text-ink underline underline-offset-4">
                  맛집 등록하기
                </Link>
              </p>
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
