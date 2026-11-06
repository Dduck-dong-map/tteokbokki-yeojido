"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { addMyReport } from "@/lib/mine";
import { send } from "@/lib/me";
import { GRADES, RICE_CAKES, STYLES, USAGES, keysOf, type RiceCake, type Usage } from "@/lib/taxonomy";
import type { Hours, Store } from "@/lib/types";
import { checkPatch, type StorePatch } from "@/lib/wiki";
import { Choice, HoursField, INPUT, MapPicker, MenuEditor, NickField, PhotoPicker } from "./fields";

function Section({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-[15px] font-bold">
        {title} {sub && <span className="text-[12px] font-normal text-ink3">{sub}</span>}
      </h2>
      {children}
    </section>
  );
}

// 정보 고치기: 누구나 고칠 수 있고 바로 반영된다. 무엇을 바꿨는지는 변경 이력에 남는다.
export default function EditForm({ store, stores }: { store: Store; stores: Store[] }) {
  const router = useRouter();
  const [name, setName] = useState(store.name);
  const [address, setAddress] = useState(store.address);
  const [grade, setGrade] = useState(store.grade);
  const [rice, setRice] = useState<RiceCake[]>(store.rice);
  const [style, setStyle] = useState(store.style);
  const [menu, setMenu] = useState(store.menu);
  const [hours, setHours] = useState<Hours | null>(store.hours ?? null);
  const [usage, setUsage] = useState<Usage[]>(store.usage);
  const [memo, setMemo] = useState(store.memo ?? "");
  const [photos, setPhotos] = useState<string[]>([]);
  const [moveOpen, setMoveOpen] = useState(false);
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const submit = async () => {
    const patch: StorePatch = { name, address, grade, rice, style, menu, hours, usage, memo, ...(photos.length ? { addPhotos: photos } : {}), ...(moveOpen && pos ? pos : {}) };
    const e = checkPatch(patch);
    if (e) return setError(e);
    setSending(true);
    const res = await send(`/api/stores/${store.id}`, { action: "edit", patch });
    setSending(false);
    if (!res.ok) return setError(res.error ?? "보내지 못했어요. 잠시 뒤 다시 해 주세요");
    addMyReport({ kind: "edit", storeId: store.id, name: name.trim() });
    router.replace(`/store/${store.id}?edited=1`);
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-6 px-5 pt-4 pb-[calc(env(safe-area-inset-bottom)+20px)]">
      <p className="rounded-xl bg-chip px-3 py-2 text-[13px] leading-relaxed text-ink2">
        고치면 바로 반영되고 <Link href={`/store/${store.id}/history`} className="font-semibold underline underline-offset-2">변경 이력</Link>에 남아요. 맵기는 여기서 안 고쳐요. 가게 화면의 「평가 남기기」에서 투표해 주세요.
      </p>

      <Section title="메뉴와 가격" sub="가장 자주 바뀌어요">
        <MenuEditor menu={menu} onChange={setMenu} />
      </Section>

      <Section title="영업시간">
        <HoursField value={hours} onChange={setHours} />
      </Section>

      <Section title="사진 더하기">
        <PhotoPicker ids={photos} onChange={setPhotos} hint="간판·메뉴판·떡볶이 사진 환영해요" />
      </Section>

      <Section title="떡과 스타일">
        <div className="flex flex-wrap gap-2">
          {keysOf(RICE_CAKES).map((k) => (
            <Choice key={k} on={rice.includes(k)} onClick={() => setRice(rice.includes(k) ? rice.filter((x) => x !== k) : [...rice, k])}>
              {RICE_CAKES[k]}
            </Choice>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {keysOf(STYLES).map((k) => (
            <Choice key={k} on={style === k} onClick={() => setStyle(k)}>
              {STYLES[k]}
            </Choice>
          ))}
        </div>
      </Section>

      <Section title="이용">
        <div className="flex flex-wrap gap-2">
          {keysOf(USAGES).map((k) => (
            <Choice key={k} on={usage.includes(k)} onClick={() => setUsage(usage.includes(k) ? usage.filter((x) => x !== k) : [...usage, k])}>
              {USAGES[k]}
            </Choice>
          ))}
        </div>
      </Section>

      <Section title="메모" sub="들어가는 길, 주문 방법 같은 것">
        <textarea value={memo} onChange={(e) => setMemo(e.target.value)} maxLength={200} rows={3} className="w-full rounded-xl border border-chipline bg-surface px-3 py-2 text-[15px] text-ink" />
      </Section>

      <Section title="가게 기본 정보">
        <div className="flex flex-col gap-3">
          <label className="text-[13px] text-ink3">
            가게 이름
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} className={INPUT} />
          </label>
          <label className="text-[13px] text-ink3">
            주소
            <input value={address} onChange={(e) => setAddress(e.target.value)} maxLength={120} className={INPUT} />
          </label>
          <div className="flex flex-wrap gap-2">
            {keysOf(GRADES).map((k) => (
              <Choice key={k} on={grade === k} onClick={() => setGrade(k)}>
                {GRADES[k]}
              </Choice>
            ))}
          </div>
          {moveOpen ? (
            <MapPicker stores={stores} start={store} onChange={setPos} />
          ) : (
            <button type="button" onClick={() => setMoveOpen(true)} className="h-10 rounded-xl border border-dashed border-chipline text-[13px] text-ink2">
              지도 위치도 고치기
            </button>
          )}
        </div>
      </Section>

      <NickField />

      {error && <p className="text-[13px] text-spicytext">{error}</p>}
      <button type="button" onClick={submit} disabled={sending} className="h-12 rounded-xl bg-accent text-[16px] font-bold text-onaccent disabled:opacity-50">
        {sending ? "저장하는 중…" : "고친 내용 올리기"}
      </button>
    </div>
  );
}
