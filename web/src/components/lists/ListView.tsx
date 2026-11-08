"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import TteokMap, { type Focus } from "@/components/map/TteokMap";
import { LIST_VISIBILITY, MAX_LIST_DESC, MAX_LIST_STORES, MAX_LIST_TITLE, checkListInfo, timeAgo, type ListVisibility, type PlaceList } from "@/lib/community";
import { won } from "@/lib/filters";
import { send } from "@/lib/me";
import { refreshOwned, useOwned } from "@/lib/owned";
import { useIsWide } from "@/lib/screen";
import { RICE_CAKES, STYLES } from "@/lib/taxonomy";
import type { Store } from "@/lib/types";
import { SampleRibbon, SpiceStamp } from "../ui";
import { LikeButton, ShareListButton } from "./ListParts";
import StorePicker, { type PickStore } from "./StorePicker";

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

export default function ListView({ list, stores, pick, nowIso }: { list: PlaceList; stores: Store[]; pick: PickStore[]; nowIso: string }) {
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

  return (
    <main className="flex-1 pb-10 md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,440px)] md:gap-6 xl:grid-cols-[minmax(0,1fr)_520px]">
      <div className="flex min-w-0 flex-col gap-4 px-4 pt-3 md:px-0">
        {list.isSample && (
          <div className="flex justify-center">
            <SampleRibbon />
          </div>
        )}

        {/* 머리: 이름 · 설명 · 누가 · 추천 · 공유 */}
        {editing ? (
          <ListInfoForm
            list={list}
            onCancel={() => setEditing(false)}
            onSave={async (patch) => {
              if (await act({ action: "update", ...patch })) setEditing(false);
            }}
          />
        ) : (
          <header className="flex flex-col gap-2">
            <h1 className="text-[22px] leading-snug font-bold text-balance">{list.title}</h1>
            {list.desc && <p className="text-[14px] leading-relaxed whitespace-pre-line text-ink2">{list.desc}</p>}
            <p className="text-[12px] text-ink3">
              {list.who} 님의 리스트 · {stores.length}곳 · {timeAgo(list.updatedAt, now)} 고침
              {list.visibility === "link" && <> · 🔗 {LIST_VISIBILITY.link}</>}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <LikeButton id={list.id} likes={list.likes} />
              <ShareListButton title={list.title} />
              {mine && (
                <button type="button" onClick={() => setEditing(true)} className="flex h-10 items-center rounded-xl border border-chipline bg-surface px-3.5 text-[14px] font-bold text-ink">
                  이름·설명 고치기
                </button>
              )}
            </div>
          </header>
        )}

        {/* 폰: 지도는 가게 줄 위에 (지도는 화면 폭에 맞는 한 곳에만 그린다) */}
        {stores.length > 0 && !wide && (
          <div className="relative h-[240px] overflow-hidden rounded-[14px] border border-line bg-paper md:hidden">
            <TteokMap stores={stores} selectedId={selected} onSelect={select} me={null} focus={focus} start={start} showName />
          </div>
        )}

        {msg && (
          <p role="alert" className="rounded-xl bg-spicybg px-3 py-2 text-[13px] text-spicytext">
            {msg}
          </p>
        )}

        {/* 가게 줄: 번호 = 리스트 순서 */}
        {stores.length ? (
          <ol className="divide-y divide-line border-y border-line">
            {stores.map((s, i) => (
              <li key={s.id} id={`row-${s.id}`} className={`flex items-center gap-3 py-3 ${selected === s.id ? "bg-chip/70" : ""}`}>
                <span className="w-6 shrink-0 text-center font-serif text-[17px] font-bold text-accent">{i + 1}</span>
                <Link href={`/store/${s.id}`} onMouseEnter={() => setSelected(s.id)} className="flex min-w-0 flex-1 items-center gap-3">
                  <SpiceStamp n={s.spice} size={28} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-bold">{s.name}</span>
                    <span className="block truncate text-[12px] text-ink3">
                      {s.dong} · {STYLES[s.style]} · {s.rice.map((r) => RICE_CAKES[r]).join("·")}
                    </span>
                  </span>
                  <b className="shrink-0 text-[14px]">{won(s.price)}</b>
                </Link>
                {mine && (
                  <span className="flex shrink-0 items-center gap-0.5">
                    <button type="button" aria-label={`${s.name} 위로`} disabled={i === 0} onClick={() => act({ action: "move", storeId: s.id, dir: -1 })} className="grid h-9 w-8 place-items-center rounded-lg text-ink2 hover:bg-chip disabled:opacity-30">
                      ↑
                    </button>
                    <button type="button" aria-label={`${s.name} 아래로`} disabled={i === stores.length - 1} onClick={() => act({ action: "move", storeId: s.id, dir: 1 })} className="grid h-9 w-8 place-items-center rounded-lg text-ink2 hover:bg-chip disabled:opacity-30">
                      ↓
                    </button>
                    <button type="button" aria-label={`${s.name} 리스트에서 빼기`} onClick={() => act({ action: "remove", storeId: s.id })} className="grid h-9 place-items-center rounded-lg px-2 text-[12px] text-ink3 hover:bg-chip">
                      빼기
                    </button>
                  </span>
                )}
              </li>
            ))}
          </ol>
        ) : (
          <p className="rounded-xl border border-dashed border-chipline px-4 py-8 text-center text-[13px] leading-relaxed text-ink3">
            아직 담긴 가게가 없어요.
            {mine ? <> 아래에서 가게를 찾아 넣거나, 가게 화면의 「리스트에 담기」를 눌러 주세요.</> : null}
          </p>
        )}

        {/* 만든 기기: 가게 넣기 · 리스트 지우기 */}
        {mine && (
          <section className="flex flex-col gap-2">
            <h2 className="text-[14px] font-bold">
              가게 넣기 <span className="font-normal text-ink3">({stores.length}/{MAX_LIST_STORES})</span>
            </h2>
            <StorePicker stores={pick} exclude={inList} onPick={(id) => act({ action: "add", storeId: id })} />
            <div className="mt-4 flex items-center justify-end gap-2 text-[13px]">
              {askDelete ? (
                <>
                  <span className="text-ink2">이 리스트를 지울까요? 받은 추천도 함께 사라져요.</span>
                  <button
                    type="button"
                    onClick={async () => {
                      const res = await send(`/api/lists/${list.id}`, { action: "delete" });
                      if (!res.ok) return setMsg(res.error ?? "지우지 못했어요");
                      void refreshOwned();
                      router.push("/mine?tab=my");
                    }}
                    className="hit h-8 rounded-lg bg-spicybg px-3 font-semibold text-spicytext"
                  >
                    지우기
                  </button>
                  <button type="button" onClick={() => setAskDelete(false)} className="hit h-8 rounded-lg border border-chipline px-3 text-ink2">
                    그만두기
                  </button>
                </>
              ) : (
                <button type="button" onClick={() => setAskDelete(true)} className="hit text-ink3 underline underline-offset-2">
                  리스트 지우기
                </button>
              )}
            </div>
          </section>
        )}
      </div>

      {/* PC: 오른쪽 큰 지도 */}
      <aside className="hidden md:block">
        <div className="sticky top-[72px] h-[calc(100dvh-104px)] min-h-[360px] overflow-hidden rounded-2xl border border-line bg-paper">
          {stores.length ? (
            wide && <TteokMap stores={stores} selectedId={selected} onSelect={select} me={null} focus={focus} start={start} showName />
          ) : (
            <p className="grid h-full place-items-center text-[13px] text-ink3">가게를 넣으면 지도에 도장이 찍혀요</p>
          )}
        </div>
      </aside>
    </main>
  );
}

// 이름 · 설명 · 공개 범위 (새로 만들 때와 고칠 때 같이 쓴다)
export function ListInfoForm({
  list,
  onSave,
  onCancel,
  submitLabel = "저장",
}: {
  list?: Pick<PlaceList, "title" | "desc" | "visibility">;
  onSave: (v: { title: string; desc: string; visibility: ListVisibility }) => void | Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
}) {
  const [title, setTitle] = useState(list?.title ?? "");
  const [desc, setDesc] = useState(list?.desc ?? "");
  const [visibility, setVisibility] = useState<ListVisibility>(list?.visibility ?? "public");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-3.5"
      onSubmit={async (e) => {
        e.preventDefault();
        const err = checkListInfo({ title, desc, visibility });
        if (err) return setError(err);
        setBusy(true);
        await onSave({ title, desc, visibility });
        setBusy(false);
      }}
    >
      <label className="flex flex-col gap-1">
        <span className="text-[13px] font-semibold text-ink2">리스트 이름</span>
        <input
          id="list-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={MAX_LIST_TITLE}
          placeholder="예: 비 오는 날 국물떡볶이"
          className="h-11 rounded-xl border border-chipline bg-surface px-3 text-[15px] outline-none focus:border-ink"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[13px] font-semibold text-ink2">설명 (선택)</span>
        <textarea
          id="list-desc"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          maxLength={MAX_LIST_DESC}
          rows={2}
          placeholder="어떤 기준으로 골랐는지 한두 줄"
          className="rounded-xl border border-chipline bg-surface px-3 py-2 text-[14px] outline-none focus:border-ink"
        />
      </label>
      <fieldset className="flex flex-wrap gap-1.5">
        <legend className="mb-1 text-[13px] font-semibold text-ink2">공개 범위</legend>
        {(Object.entries(LIST_VISIBILITY) as [ListVisibility, string][]).map(([k, v]) => (
          <button
            key={k}
            type="button"
            aria-pressed={visibility === k}
            onClick={() => setVisibility(k)}
            className={`h-9 rounded-full border px-3.5 text-[13px] ${visibility === k ? "border-ink bg-ink font-semibold text-paper" : "border-chipline bg-surface text-ink2"}`}
          >
            {v}
          </button>
        ))}
        <p className="w-full text-[12px] text-ink3">
          {visibility === "public" ? "「모두의 리스트」에 올라가 누구나 보고 추천할 수 있어요." : "목록에는 안 나오고, 링크를 받은 사람만 볼 수 있어요."}
        </p>
      </fieldset>
      {error && (
        <p role="alert" className="text-[13px] text-spicytext">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="h-10 rounded-xl border border-chipline px-4 text-[14px] text-ink2">
            그만두기
          </button>
        )}
        <button type="submit" disabled={busy} className="h-10 rounded-xl bg-primary px-5 text-[14px] font-bold text-onprimary disabled:opacity-60">
          {busy ? "저장하는 중…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
