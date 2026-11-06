"use client";

import Link from "next/link";
import { useState } from "react";
import { addMyReport } from "@/lib/mine";
import { send } from "@/lib/me";
import { GRADES, RICE_CAKES, STYLES, keysOf, type RiceCake } from "@/lib/taxonomy";
import type { Store } from "@/lib/types";
import { MIN_PHOTOS, VERIFY_DAYS, VERIFY_YES, checkNewStore, type NewStoreInput } from "@/lib/wiki";
import { Choice, INPUT, MapPicker, MenuEditor, NickField, PhotoPicker, SpiceInput, StarInput } from "./fields";

// 새 가게 제보: 가게 → 떡·맛 → 가격 → 사진. 보내면 승인 없이 바로 지도에 올라간다.
const STEPS = ["가게", "떡·맛", "가격", "사진"];

type Draft = Partial<NewStoreInput> & Pick<NewStoreInput, "name" | "address" | "rice" | "menu" | "photos">;

export default function ReportForm({ stores }: { stores: Store[] }) {
  const [step, setStep] = useState(0);
  const [r, setR] = useState<Draft>({ name: "", address: "", rice: [], menu: [{ name: "", price: 0 }], photos: [] });
  const [error, setError] = useState<string | null>(null);
  const [existing, setExisting] = useState<string | null>(null);
  const [doneId, setDoneId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const stepError = () => {
    if (step === 0) {
      if (!r.name.trim()) return "가게 이름을 넣어 주세요";
      if (!r.grade) return "어떤 가게인지 골라 주세요";
      if (!r.address.trim()) return "주소를 넣어 주세요";
    }
    if (step === 1) {
      if (!r.rice.length) return "떡을 하나 이상 골라 주세요";
      if (!r.style) return "스타일을 골라 주세요";
      if (!r.spice) return "맵기를 골라 주세요";
    }
    if (step === 2) {
      if (!r.menu[0].name.trim()) return "대표 메뉴 이름을 넣어 주세요";
      if (!r.menu[0].price) return "대표 메뉴 가격을 넣어 주세요";
    }
    return null;
  };

  const submit = async () => {
    const e = checkNewStore(r);
    if (e) return setError(e);
    setSending(true);
    const res = await send("/api/stores", r);
    setSending(false);
    if (!res.ok) {
      setExisting(res.existing ?? null);
      return setError(res.error ?? "보내지 못했어요. 잠시 뒤 다시 해 주세요");
    }
    addMyReport({ kind: "new", storeId: res.id, name: r.name.trim() });
    setDoneId(res.id!);
  };

  const next = () => {
    const e = stepError();
    if (e) return setError(e);
    setError(null);
    setExisting(null);
    if (step < STEPS.length - 1) setStep(step + 1);
    else submit();
  };

  if (doneId)
    return (
      <div className="px-6 py-16 text-center">
        <p className="text-[40px]">🍢</p>
        <h2 className="mt-3 text-[20px] font-bold">지도에 올렸어요. 서비스 어묵 하나 드려요</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink2">
          일주일 동안 「확인 중」으로 보여요.
          <br />
          가 본 사람 {VERIFY_YES}명이 「맞아요」를 누르면 확인이 끝나요.
        </p>
        <Link href={`/store/${doneId}`} className="mt-8 inline-grid h-12 w-full place-items-center rounded-xl bg-accent text-[16px] font-bold text-onaccent">
          올린 가게 보기
        </Link>
        <Link href="/" className="mt-2 inline-grid h-11 w-full place-items-center rounded-xl border border-chipline bg-surface text-[14px] text-ink2">
          지도로 돌아가기
        </Link>
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
        {step === 0 && (
          <div className="flex flex-col gap-4">
            <h2 className="text-[18px] font-bold">어떤 가게인가요?</h2>
            <label className="text-[13px] text-ink3">
              가게 이름
              <input value={r.name} onChange={(e) => setR({ ...r, name: e.target.value })} maxLength={60} placeholder="예: 망원 할머니 떡볶이" className={INPUT} />
            </label>
            <div>
              <p className="mb-1.5 text-[13px] text-ink3">떡볶이를 어떻게 파나요?</p>
              <div className="flex flex-wrap gap-2">
                {keysOf(GRADES).map((k) => (
                  <Choice key={k} on={r.grade === k} onClick={() => setR({ ...r, grade: k })}>
                    {GRADES[k]}
                  </Choice>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-[13px] text-ink3">가게 위치</p>
              <MapPicker stores={stores} onChange={(p) => setR((cur) => ({ ...cur, ...p }))} />
            </div>
            <label className="text-[13px] text-ink3">
              주소
              <input value={r.address} onChange={(e) => setR({ ...r, address: e.target.value })} maxLength={120} placeholder="예: 서울 마포구 망원동 123" className={INPUT} />
            </label>
          </div>
        )}

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
              <h2 className="mb-2 text-[15px] font-bold">맵기 <span className="text-[12px] font-normal text-ink3">신라면 = 3 · 맛 평점</span></h2>
              <SpiceInput value={r.spice} onChange={(spice) => setR({ ...r, spice })} />
            </div>
            <div>
              <h2 className="mb-2 text-[15px] font-bold">가게는 어땠어요? <span className="text-[12px] font-normal text-ink3">선택 · 가게 평점</span></h2>
              <StarInput value={r.stars} onChange={(stars) => setR({ ...r, stars })} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-[18px] font-bold">얼마예요?</h2>
            <p className="mt-1 mb-4 text-[13px] text-ink3">대표 메뉴 하나면 충분해요. 나머지는 나중에 누구나 더할 수 있어요.</p>
            <MenuEditor menu={r.menu} onChange={(menu) => setR({ ...r, menu })} />
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-[18px] font-bold">간판이나 메뉴판 사진을 올려 주세요</h2>
              <p className="mt-1 mb-3 text-[13px] text-ink3">직접 찍은 사진 {MIN_PHOTOS}장 이상 · 진짜 있는 가게인지 확인하는 데 써요</p>
              <PhotoPicker ids={r.photos} onChange={(photos) => setR({ ...r, photos })} hint="사람 얼굴이 크게 나오지 않게 찍어 주세요" />
            </div>
            <NickField />
            <p className="rounded-xl bg-chip px-3 py-2 text-[12px] leading-relaxed text-ink2">
              보내면 바로 지도에 올라가고, {VERIFY_DAYS}일 동안 「확인 중」으로 보여요. 사실과 다르면 다른 사람이 고치거나 신고할 수 있어요.
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="mb-2 text-[13px] text-spicytext">
          {error}
          {existing && (
            <Link href={`/store/${existing}`} className="ml-2 font-bold underline underline-offset-2">
              그 가게 보기
            </Link>
          )}
        </p>
      )}
      <div className="mt-4 flex gap-2">
        {step > 0 && (
          <button type="button" onClick={() => { setError(null); setExisting(null); setStep(step - 1); }} className="h-12 w-20 rounded-xl border border-chipline bg-surface text-[15px] text-ink2">
            이전
          </button>
        )}
        <button type="button" onClick={next} disabled={sending} className="h-12 flex-1 rounded-xl bg-accent text-[16px] font-bold text-onaccent disabled:opacity-50">
          {step < STEPS.length - 1 ? "다음" : sending ? "올리는 중…" : "지도에 올리기"}
        </button>
      </div>
    </div>
  );
}
