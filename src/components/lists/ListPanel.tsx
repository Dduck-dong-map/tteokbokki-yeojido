"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { Focus } from "@/components/map/TteokMap";
import type { PlaceList } from "@/lib/community";
import { send } from "@/lib/me";
import { refreshOwned, useOwned } from "@/lib/owned";
import { useIsWide } from "@/lib/screen";
import type { Store } from "@/lib/types";
import { useListInfo } from "./ListInfoForm";
import ListPanelView from "./ListPanelView";
import type { PickStore } from "./StorePicker";

// 리스트 상세 화면의 컨테이너 (리팩토링 계획 2026-11-09 · 7-1 형태 2).
// 옛 이름 ListView 는 View 접미사와 겹쳐 ListPanel 로 바꿨다(계획 ⑧). 서버 페이지는 default export 와 props 를 그대로 쓴다.
// 여기서는 상태·핸들러·fetch·router·화면 폭·scrollIntoView 만 다루고, 마크업은 ListPanelView 가 맡는다(계약: ./types.ts).

// 담긴 가게가 다 보이는 처음 위치. 좁은 폰 지도(폭 340px 쯤)에서도 다 들어오게 어림한다.
// MapLibre 는 한 단계에서 세계 둘레가 512px × 2^zoom 이다. 위도 37도에서는 세로가 1/cos(37°)≈1.25 배 늘어난다.
function startOf(stores: Store[], width: number) {
  if (!stores.length) return undefined;
  const lats = stores.map((s) => s.lat);
  const lngs = stores.map((s) => s.lng);
  const span = Math.max((Math.max(...lats) - Math.min(...lats)) * 1.25, Math.max(...lngs) - Math.min(...lngs), 0.002);
  const zoom = Math.min(16, Math.max(11, Math.log2((360 * width) / (512 * span * 1.3))));
  return { lat: (Math.max(...lats) + Math.min(...lats)) / 2, lng: (Math.max(...lngs) + Math.min(...lngs)) / 2, zoom };
}

export default function ListPanel({ list, stores, pick, nowIso }: { list: PlaceList; stores: Store[]; pick: PickStore[]; nowIso: string }) {
  const router = useRouter();
  const { data } = useOwned();
  const wide = useIsWide();
  const mine = data.lists.some((l) => l.id === list.id);
  const now = new Date(nowIso);
  const [selected, setSelected] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [askDelete, setAskDelete] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const start = useMemo(() => startOf(stores, wide ? 460 : 340), [stores, wide]);
  // 가게를 넣고 빼면 담긴 가게가 다 보이게 다시 맞춘다 (처음 위치는 start 가 맡는다)
  const key = stores.map((s) => s.id).join(",");
  const [fit, setFit] = useState<{ key: string; n: number }>({ key, n: 0 });
  if (fit.key !== key) setFit({ key, n: fit.n + 1 });
  const focus = useMemo<Focus | null>(() => {
    if (!fit.n || !stores.length) return null;
    const lats = stores.map((s) => s.lat);
    const lngs = stores.map((s) => s.lng);
    return { n: fit.n, bounds: { w: Math.min(...lngs), s: Math.min(...lats), e: Math.max(...lngs), n: Math.max(...lats) } };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 가게 목록이 바뀐 때(fit.n)만 다시 맞춘다
  }, [fit.n]);
  const inList = useMemo(() => new Set(list.storeIds), [list.storeIds]);

  const act = async (body: Record<string, unknown>) => {
    const res = await send(`/api/lists/${list.id}`, body);
    if (!res.ok) {
      setMsg(res.error ?? "고치지 못했어요");
      return false;
    }
    setMsg(null);
    void refreshOwned();
    router.refresh();
    return true;
  };

  const select = (id: string | null) => {
    setSelected(id);
    if (id) document.getElementById(`row-${id}`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  };

  // 머리의 「이름·설명 고치기」 폼. editing 일 때 ListPanelView 가 머리 대신 그린다.
  const info = useListInfo(
    list,
    async (patch) => {
      if (await act({ action: "update", ...patch })) setEditing(false);
    },
    { onCancel: () => setEditing(false) },
  );

  const remove = async () => {
    const res = await send(`/api/lists/${list.id}`, { action: "delete" });
    if (!res.ok) return setMsg(res.error ?? "지우지 못했어요");
    void refreshOwned();
    router.push("/mine?tab=my");
  };

  return (
    <ListPanelView
      list={list}
      stores={stores}
      pick={pick}
      now={now}
      mine={mine}
      wide={wide}
      selectedId={selected}
      editing={editing}
      askDelete={askDelete}
      message={msg}
      start={start}
      focus={focus}
      inList={inList}
      info={info}
      onSelect={select}
      onEditStart={() => {
        // 열 때마다 리스트의 현재 값으로 되돌린다 (옛 동작: 폼이 새로 마운트되며 초기화됐다)
        info.onChange({ title: list.title, desc: list.desc ?? "", visibility: list.visibility });
        setEditing(true);
      }}
      onMove={(id, dir) => act({ action: "move", storeId: id, dir })}
      onRemove={(id) => act({ action: "remove", storeId: id })}
      onAdd={(id) => act({ action: "add", storeId: id })}
      onAskDelete={setAskDelete}
      onDelete={remove}
    />
  );
}
