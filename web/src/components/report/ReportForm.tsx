"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { won } from "@/lib/filters";
import { PRICE_HINTS, checkReport, type ReportInput, type ReportKind } from "@/lib/report";
import { RICE_CAKES, SPICE_LEVELS, STYLES, keysOf, type RiceCake, type Spice } from "@/lib/taxonomy";
import { SpiceStamp } from "../ui";

type StoreRef = { id: string; name: string; address: string };

// 제보하기: 30초 안에 끝나는 4단계 (기획안 6절)
// ① 가게 → ② 떡·스타일·맵기 → ③ 가격 → ④ 사진(선택). 폐업 신고는 한 번에.
const STEPS = ["가게", "떡·맛", "가격", "사진"];

function Choice({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`h-10 rounded-full border px-4 text-[14px] font-medium ${on ? "border-primary bg-primary text-onprimary" : "border-chipline bg-surface text-ink2"}`}
    >
      {children}
    </button>
  );
}

export default function ReportForm({ stores }: { stores: StoreRef[] }) {
  const q = useSearchParams();
  const target = stores.find((s) => s.id === q.get("store"));
  const kind: ReportKind = target ? (q.get("kind") === "closed" ? "closed" : "edit") : "new";

  const [step, setStep] = useState(0);
  const [r, setR] = useState<ReportInput>({ kind, storeId: target?.id, name: target?.name ?? "", address: target?.address ?? "", rice: [] });
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [sending, setSending] = useState(false);

  const stepError = () => {
    if (step === 0 && kind === "new" && (!r.name?.trim() || !r.address?.trim())) return "가게 이름과 주소를 넣어 주세요";
    if (step === 1) {
      if (!r.rice.length) return "떡을 하나 이상 골라 주세요";
      if (!r.style) return "스타일을 골라 주세요";
      if (!r.spice) return "맵기를 골라 주세요";
    }
    return null;
  };

  const submit = async () => {
    const e = checkReport(r);
    if (e) return setError(e);
    setSending(true);
    const res = await fetch("/api/reports", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(r) }).catch(() => null);
    setSending(false);
    if (!res?.ok) return setError((await res?.json().catch(() => null))?.error ?? "보내지 못했어요. 잠시 뒤 다시 해 주세요");
    setDone(true);
  };

  const next = () => {
    const e = stepError();
    if (e) return setError(e);
    setError(null);
    if (step < STEPS.length - 1) setStep(step + 1);
    else submit();
  };

  if (done)
    return (
      <div className="px-6 py-16 text-center">
        <p className="text-[40px]">🍢</p>
        <h2 className="mt-3 text-[20px] font-bold">서비스 어묵 하나 올려 드렸어요</h2>
        <p className="mt-2 text-[14px] text-ink2">승인되면 지도에 올라가요. 고마워요!</p>
        <p className="mt-1 text-[12px] text-ink3">(지금은 시험판이라 제보가 저장되지 않아요)</p>
        <Link href="/" className="mt-8 inline-grid h-12 w-full place-items-center rounded-xl bg-primary text-[16px] font-bold text-onprimary">
          지도로 돌아가기
        </Link>
      </div>
    );

  if (kind === "closed")
    return (
      <div className="px-5 py-8">
        <h2 className="text-[18px] font-bold">「{target!.name}」 문을 닫았나요?</h2>
        <p className="mt-2 text-[14px] text-ink2">운영자가 확인한 뒤 지도에서 내려요. 같은 신고가 3건 모이면 먼저 확인해요.</p>
        {error && <p className="mt-3 text-[13px] text-spicytext">{error}</p>}
        <button type="button" onClick={submit} disabled={sending} className="mt-6 h-12 w-full rounded-xl bg-primary text-[16px] font-bold text-onprimary disabled:opacity-50">
          {sending ? "보내는 중…" : "폐업 신고 보내기"}
        </button>
      </div>
    );

  return (
    <div className="flex min-h-[calc(100dvh-48px)] flex-col px-5 pt-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
      <ol className="flex gap-1.5" aria-label="단계">
        {STEPS.map((s, i) => (
          <li key={s} className="flex-1">
            <span className={`block h-1 rounded-full ${i <= step ? "bg-primary" : "bg-chipline"}`} />
            <span className={`mt-1 block text-[11px] ${i === step ? "font-bold text-ink" : "text-ink3"}`}>
              {i + 1}. {s}
            </span>
          </li>
        ))}
      </ol>

      <div className="mt-6 flex-1">
        {step === 0 &&
          (kind === "edit" ? (
            <div>
              <h2 className="text-[18px] font-bold">「{target!.name}」 정보를 고쳐요</h2>
              <p className="mt-1 text-[13px] text-ink3">{target!.address}</p>
              <p className="mt-4 text-[14px] text-ink2">가격·맵기 수정은 다른 두 분이 「맞아요」를 누르면 바로 반영돼요.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <h2 className="text-[18px] font-bold">어떤 가게인가요?</h2>
              <label className="text-[13px] text-ink3">
                가게 이름
                <input
                  value={r.name}
                  onChange={(e) => setR({ ...r, name: e.target.value })}
                  maxLength={60}
                  placeholder="예: 망원 할머니 떡볶이"
                  className="mt-1 h-12 w-full rounded-xl border border-chipline bg-surface px-3 text-[15px] text-ink"
                />
              </label>
              <label className="text-[13px] text-ink3">
                주소
                <input
                  value={r.address}
                  onChange={(e) => setR({ ...r, address: e.target.value })}
                  maxLength={120}
                  placeholder="도로명 주소 (나중에 주소 검색으로 바꿔요)"
                  className="mt-1 h-12 w-full rounded-xl border border-chipline bg-surface px-3 text-[15px] text-ink"
                />
              </label>
            </div>
          ))}

        {step === 1 && (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="mb-2 text-[15px] font-bold">떡 <span className="text-[12px] font-normal text-ink3">여러 개</span></h2>
              <div className="flex flex-wrap gap-2">
                {keysOf(RICE_CAKES).map((k: RiceCake) => (
                  <Choice key={k} on={r.rice.includes(k)} onClick={() => setR({ ...r, rice: r.rice.includes(k) ? r.rice.filter((x) => x !== k) : [...r.rice, k] })}>
                    {RICE_CAKES[k]}
                  </Choice>
                ))}
              </div>
            </div>
            <div>
              <h2 className="mb-2 text-[15px] font-bold">스타일 <span className="text-[12px] font-normal text-ink3">하나</span></h2>
              <div className="flex flex-wrap gap-2">
                {keysOf(STYLES).map((k) => (
                  <Choice key={k} on={r.style === k} onClick={() => setR({ ...r, style: k })}>
                    {STYLES[k]}
                  </Choice>
                ))}
              </div>
            </div>
            <div>
              <h2 className="mb-2 text-[15px] font-bold">맵기 <span className="text-[12px] font-normal text-ink3">신라면 = 3</span></h2>
              <div className="flex justify-between gap-1">
                {([1, 2, 3, 4, 5] as Spice[]).map((lv) => (
                  <button key={lv} type="button" onClick={() => setR({ ...r, spice: lv })} aria-pressed={r.spice === lv} className={`flex flex-1 flex-col items-center gap-1 rounded-xl border py-2 ${r.spice === lv ? "border-primary" : "border-transparent"}`}>
                    <SpiceStamp n={lv} size={32} />
                    <span className="text-[11px] leading-tight text-ink3">{SPICE_LEVELS[lv].ref.replace(" 정도", "")}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-[18px] font-bold">떡볶이 1인분은 얼마예요?</h2>
            <p className="mt-1 text-[13px] text-ink3">모르면 건너뛰어도 돼요</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {PRICE_HINTS.map((p) => (
                <Choice key={p} on={r.price === p} onClick={() => setR({ ...r, price: r.price === p ? undefined : p })}>
                  {won(p)}
                </Choice>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-[18px] font-bold">사진이 있으면 올려 주세요</h2>
            <p className="mt-1 text-[13px] text-ink3">직접 찍은 사진만 받아요 · 선택</p>
            <label className="mt-4 grid h-36 cursor-pointer place-items-center rounded-2xl border border-dashed border-chipline bg-surface text-[14px] text-ink3">
              사진 고르기 (시험판에서는 올라가지 않아요)
              <input type="file" accept="image/*" className="hidden" />
            </label>
          </div>
        )}
      </div>

      {error && <p className="mb-2 text-[13px] text-spicytext">{error}</p>}
      <div className="flex gap-2">
        {step > 0 && (
          <button type="button" onClick={() => { setError(null); setStep(step - 1); }} className="h-12 w-20 rounded-xl border border-chipline bg-surface text-[15px] text-ink2">
            이전
          </button>
        )}
        <button type="button" onClick={next} disabled={sending} className="h-12 flex-1 rounded-xl bg-primary text-[16px] font-bold text-onprimary disabled:opacity-50">
          {step < STEPS.length - 1 ? "다음" : sending ? "보내는 중…" : "제보 보내기"}
        </button>
      </div>
    </div>
  );
}
