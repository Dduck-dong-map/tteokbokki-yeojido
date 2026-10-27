"use client";

import { useState } from "react";
import { distanceM } from "@/lib/filters";

// '아직 있어요': 가게 근처(200m 안)에서만 누를 수 있다 (기획안 5·7절).
// 눌리면 마지막 확인일을 새로 고친다 → Supabase 연결(M2) 전에는 저장하지 않는다.
const NEAR_M = 200;

export function StillHere({ lat, lng }: { lat: number; lng: number }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const press = () => {
    if (!navigator.geolocation) return setMsg("이 브라우저는 위치를 못 받아요");
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setBusy(false);
        const d = distanceM({ lat: p.coords.latitude, lng: p.coords.longitude }, { lat, lng });
        setMsg(d <= NEAR_M ? "확인 고마워요! (지금은 시험판이라 저장되지 않아요)" : `가게 근처 ${NEAR_M}m 안에서만 누를 수 있어요`);
      },
      () => {
        setBusy(false);
        setMsg("위치를 허용해야 누를 수 있어요");
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  return (
    <div>
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
