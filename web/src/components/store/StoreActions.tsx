"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { NickField, StarInput } from "@/components/register/fields";
import { distanceM } from "@/lib/filters";
import { send, uploadPhoto } from "@/lib/me";
import { FLAG_REASONS, HIDE_AT, VERIFY_YES, type FlagReason } from "@/lib/wiki";

// '아직 있어요': 가게 근처(200m 안)에서만 누를 수 있다 (기획안 5·7절).
// 거리는 기기 안에서 재고, 위치 자체는 서버로 보내지 않는다.
const NEAR_M = 200;

export function StillHere({ id, lat, lng }: { id: string; lat: number; lng: number }) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const press = () => {
    if (!navigator.geolocation) return setMsg("이 브라우저는 위치를 못 받아요");
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      async (p) => {
        const d = distanceM({ lat: p.coords.latitude, lng: p.coords.longitude }, { lat, lng });
        if (d > NEAR_M) {
          setBusy(false);
          return setMsg(`가게 근처 ${NEAR_M}m 안에서만 누를 수 있어요`);
        }
        const res = await send(`/api/stores/${id}`, { action: "still" });
        setBusy(false);
        setMsg(res.ok ? "확인 고마워요!" : (res.error ?? "보내지 못했어요"));
        if (res.ok) router.refresh();
      },
      () => {
        setBusy(false);
        setMsg("위치를 허용해야 누를 수 있어요");
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  return (
    <div className="text-right">
      <button type="button" onClick={press} disabled={busy} className="h-10 rounded-xl border border-ink2 bg-surface px-4 text-[14px] font-bold disabled:opacity-50">
        {busy ? "위치 확인 중…" : "아직 있어요"}
      </button>
      {msg && <p className="mt-1.5 text-[12px] text-ink3">{msg}</p>}
    </div>
  );
}

export function CopyAddress({ address }: { address: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="h-8 shrink-0 rounded-full border border-chipline bg-chip px-3 text-[12px] text-ink2"
      onClick={() =>
        navigator.clipboard?.writeText(address).then(() => {
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        })
      }
    >
      {done ? "복사했어요" : "주소 복사"}
    </button>
  );
}

// 새로 올라온 가게: 가 본 사람이 「맞아요」「달라요」로 걸러 낸다
export function VerifyButtons({ id, compact = false }: { id: string; compact?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const vote = async (ok: boolean) => {
    setBusy(true);
    const res = await send(`/api/stores/${id}`, { action: "verify", ok });
    setBusy(false);
    setMsg(res.ok ? "알려 주셔서 고마워요!" : (res.error ?? "보내지 못했어요"));
    if (res.ok) router.refresh();
  };

  return (
    <div>
      <div className="flex gap-2">
        <button type="button" disabled={busy} onClick={() => vote(true)} className={`flex-1 rounded-xl bg-accent font-bold text-onaccent disabled:opacity-50 ${compact ? "h-9 text-[13px]" : "h-11 text-[14px]"}`}>
          맞아요
        </button>
        <button type="button" disabled={busy} onClick={() => vote(false)} className={`flex-1 rounded-xl border border-ink2 bg-surface font-bold disabled:opacity-50 ${compact ? "h-9 text-[13px]" : "h-11 text-[14px]"}`}>
          달라요
        </button>
      </div>
      {msg && <p className="mt-1.5 text-[12px] text-ink3">{msg}</p>}
    </div>
  );
}

export function VerifyBar({ id, by, yes, no }: { id: string; by?: string; yes: number; no: number }) {
  return (
    <section className="rounded-2xl border border-dashed border-ink3 bg-surface p-4">
      <h3 className="text-[15px] font-bold">아직 확인 중인 가게예요</h3>
      <p className="mt-1 text-[13px] leading-relaxed text-ink2">
        {by ? `${by} 님이 등록했어요. ` : ""}가 보신 적 있으면 알려 주세요. 「맞아요」 {VERIFY_YES}명이면 확인이 끝나고, 「달라요」 {HIDE_AT}명이면 지도에서 내려요.
      </p>
      <p className="mt-2 text-[13px] font-semibold">
        맞아요 {yes} · 달라요 {no}
      </p>
      <div className="mt-2.5">
        <VerifyButtons id={id} />
      </div>
    </section>
  );
}

// 가게 상세에서 바로 사진 더하기
export function AddPhoto({ id, large = false }: { id: string; large?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const pick = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    setMsg(null);
    const ids: string[] = [];
    for (const f of Array.from(files).slice(0, 5)) {
      const r = await uploadPhoto(f);
      if ("id" in r) ids.push(r.id);
      else setMsg(r.error);
    }
    if (ids.length) {
      const res = await send(`/api/stores/${id}`, { action: "edit", patch: { addPhotos: ids } });
      if (res.ok) router.refresh();
      else setMsg(res.error ?? "사진을 올리지 못했어요");
    }
    setBusy(false);
  };

  return (
    <label className={`grid cursor-pointer place-items-center border border-dashed border-chipline bg-surface text-center text-[13px] text-ink3 ${large ? "h-32 w-full rounded-2xl" : "h-32 w-24 shrink-0 rounded-xl"}`}>
      <span>
        {busy ? "올리는 중…" : large ? "아직 사진이 없어요 · 눌러서 올려 주세요" : "+ 사진"}
        {msg && <span className="mt-1 block text-[12px] text-spicytext">{msg}</span>}
      </span>
      <input type="file" accept="image/*" multiple className="hidden" disabled={busy} onChange={(e) => pick(e.target.files)} />
    </label>
  );
}

// 평가 남기기: 별점(필수) + 한 줄 후기 (기기마다 하나, 다시 쓰면 바뀐다). 맵기는 정보 고치기에서 고친다.
export function ReviewForm({ id }: { id: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [stars, setStars] = useState<number | undefined>();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!open)
    return (
      <button type="button" onClick={() => setOpen(true)} className="h-11 w-full rounded-xl border border-chipline bg-surface text-[14px] font-bold">
        별점과 한 줄 후기 남기기
      </button>
    );

  const submit = async () => {
    if (!stars) return setError("별점을 골라 주세요");
    setBusy(true);
    const res = await send(`/api/stores/${id}`, { action: "review", stars, text });
    setBusy(false);
    if (!res.ok) return setError(res.error ?? "보내지 못했어요");
    setOpen(false);
    setError(null);
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line p-3">
      <div>
        <p className="mb-1 text-[13px] font-bold">가게는 어땠어요?</p>
        <StarInput value={stars} onChange={setStars} hint="골라 주세요" />
      </div>
      <label className="text-[13px] font-bold">
        한 줄 후기 <span className="font-normal text-ink3">선택</span>
        <input value={text} onChange={(e) => setText(e.target.value)} maxLength={80} placeholder="예: 어묵 국물이 진해요" className="mt-1 h-11 w-full rounded-xl border border-chipline bg-surface px-3 text-[16px] font-normal text-ink" />
      </label>
      <NickField />
      {error && <p className="text-[13px] text-spicytext">{error}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={() => setOpen(false)} className="h-11 w-20 rounded-xl border border-chipline bg-surface text-[14px] text-ink2">
          닫기
        </button>
        <button type="button" onClick={submit} disabled={busy} className="h-11 flex-1 rounded-xl bg-accent text-[14px] font-bold text-onaccent disabled:opacity-50">
          {busy ? "보내는 중…" : "올리기"}
        </button>
      </div>
    </div>
  );
}

export function FlagReviewButton({ storeId, reviewId }: { storeId: string; reviewId: string }) {
  const [msg, setMsg] = useState<string | null>(null);
  if (msg) return <span className="text-[11px] text-ink3">{msg}</span>;
  return (
    <button
      type="button"
      className="text-[11px] text-ink3 underline underline-offset-2"
      onClick={async () => {
        const res = await send(`/api/stores/${storeId}`, { action: "flag-review", reviewId });
        setMsg(res.ok ? "신고했어요" : (res.error ?? "보내지 못했어요"));
      }}
    >
      신고
    </button>
  );
}

// 맨 아래 넷: 정보 고치기 · 변경 이력 · 공유 · 신고
export function MoreActions({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [flagOpen, setFlagOpen] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const share = async () => {
    const url = window.location.href.split("?")[0];
    try {
      if (navigator.share) await navigator.share({ title: name, url });
      else {
        await navigator.clipboard.writeText(url);
        setMsg("주소를 복사했어요");
      }
    } catch {
      // 공유 창을 닫은 경우
    }
  };

  const flag = async (reason: FlagReason) => {
    const res = await send(`/api/stores/${id}`, { action: "flag", reason });
    setFlagOpen(false);
    setMsg(res.ok ? `신고했어요. ${HIDE_AT}명이 같은 가게를 신고하면 지도에서 내려요` : (res.error ?? "보내지 못했어요"));
    if (res.ok) router.refresh();
  };

  const cell = "grid h-11 place-items-center rounded-xl border border-chipline bg-surface text-[13px] text-ink2";
  return (
    <section>
      <div className="grid grid-cols-4 gap-1.5">
        <Link href={`/store/${id}/edit`} className={`${cell} font-bold text-ink`}>
          정보 고치기
        </Link>
        <Link href={`/store/${id}/history`} className={cell}>
          변경 이력
        </Link>
        <button type="button" onClick={share} className={cell}>
          공유
        </button>
        <button type="button" onClick={() => setFlagOpen(!flagOpen)} aria-expanded={flagOpen} className={cell}>
          신고
        </button>
      </div>
      {flagOpen && (
        <ul className="mt-2 divide-y divide-line rounded-xl border border-line bg-surface">
          {(Object.keys(FLAG_REASONS) as FlagReason[]).map((r) => (
            <li key={r}>
              <button type="button" onClick={() => flag(r)} className="h-11 w-full px-3 text-left text-[14px]">
                {FLAG_REASONS[r]}
              </button>
            </li>
          ))}
        </ul>
      )}
      {msg && <p className="mt-2 text-center text-[12px] text-ink3">{msg}</p>}
    </section>
  );
}
