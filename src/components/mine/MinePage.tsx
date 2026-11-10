"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { type PlaceList } from "@/lib/community";
import { distanceM } from "@/lib/filters";
import { send } from "@/lib/me";
import { toggleSave, toggleVisited, useMine } from "@/lib/mine";
import { refreshOwned, useOwned } from "@/lib/owned";
import { useGrantedLocation } from "@/lib/screen";
import type { Store } from "@/lib/types";
import { useListInfo } from "../lists/ListInfoForm";
import MinePageView from "./MinePageView";
import type { ListSort, MineTab, SavedRow } from "./types";

// 내 맛지도 (11-08 사용자 지시): 가게를 모아 「맛집 리스트」를 만들고, 공개해서 서로 나누고 추천한다.
// 탭: 내 리스트 · 모두의 리스트(추천순/최신순) · 찜한 가게(♡) · 내 등록
// 컨테이너 (리팩토링 계획 2026-11-09 · 7-1 형태 2): 상태·핸들러·fetch·router·history·localStorage(lib/mine) 만 다루고,
// 마크업은 MinePageView 가 맡는다(계약: ./types.ts). 서버 페이지(mine/page.tsx)는 default export 와 MineTab 을 그대로 쓴다.
export type { MineTab } from "./types";

export default function MinePage({ stores, lists, sample, nowIso, initialTab }: { stores: Store[]; lists: PlaceList[]; sample: boolean; nowIso: string; initialTab: MineTab }) {
  const router = useRouter();
  const mine = useMine();
  const owned = useOwned();
  const [tab, setTab] = useState<MineTab>(initialTab);
  const [sort, setSort] = useState<ListSort>("likes");
  const [creating, setCreating] = useState(false);
  const [onlyVisited, setOnlyVisited] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const me = useGrantedLocation();
  const now = new Date(nowIso);
  const byId = new Map(stores.map((s) => [s.id, s]));

  // 찜한 가게: 위치가 있으면 가까운순, 없으면 최근 저장순
  const saved: SavedRow[] = [];
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

  // 「새 리스트 만들기」 폼. 훅이라 creating 과 상관없이 늘 부르고, View 가 creating 일 때만 그린다.
  const createForm = useListInfo({ title: "", desc: "", visibility: "public" }, (v) => createList(v), { submitLabel: "만들기", onCancel: () => setCreating(false) });

  // 탭은 주소(?tab=)에만 남기고 서버 왕복은 하지 않는다. replaceState 는 Next 라우터와 동기화된다(번들 문서 Native History API 절).
  const onTabChange = (next: MineTab) => {
    setTab(next);
    setMsg(null);
    window.history.replaceState(null, "", `/mine?tab=${next}`);
  };

  return (
    <MinePageView
      tab={tab}
      counts={counts}
      stores={byId}
      myLists={owned.data.lists}
      ownedLoaded={owned.loaded}
      publicLists={allLists}
      publicCount={lists.length}
      sort={sort}
      saved={saved}
      savedShown={savedShown}
      onlyVisited={onlyVisited}
      reports={mine.reports}
      me={me}
      now={now}
      sample={sample}
      creating={creating}
      message={msg}
      createForm={createForm}
      onTabChange={onTabChange}
      onSortChange={setSort}
      onToggleOnlyVisited={() => setOnlyVisited((v) => !v)}
      onCreatingChange={(on) => {
        // 열 때마다 빈 폼으로 (옛 동작: ListInfoForm 이 새로 마운트되며 초기화됐다)
        if (on) createForm.onChange({ title: "", desc: "", visibility: "public" });
        setCreating(on);
      }}
      onCreateFromSaved={() => createList({ title: "찜한 떡볶이집", desc: "", visibility: "link" }, saved.map((x) => x.s.id))}
      onToggleVisited={toggleVisited}
      onUnsave={toggleSave}
    />
  );
}
