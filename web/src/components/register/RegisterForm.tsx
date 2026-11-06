"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { send } from "@/lib/me";
import { addMyReport } from "@/lib/mine";
import { GRADES, RICE_CAKES, STYLES, keysOf, type RiceCake } from "@/lib/taxonomy";
import type { Store } from "@/lib/types";
import { MIN_PHOTOS, VERIFY_DAYS, VERIFY_YES, checkIntro, checkNewStore, type NewStoreInput } from "@/lib/wiki";
import { Choice, HoursField, INPUT, IntroField, MapPicker, MenuEditor, NickField, PhotoPicker, SpiceInput, StarInput } from "./fields";

// 맛집 등록 + 소개글 (보드 WB-02 · 웹 1차 기획 M-W-03). 보내면 승인 없이 바로 지도에 올라간다.
// 폰은 다섯 단계를 한 칸씩 넘기고, 768 이상은 같은 칸들을 한 화면에 잇는다(오른쪽에 지도·사진). 칸은 하나만 만들어 CSS 로 나눈다.
const STEPS = ["가게 · 위치", "떡 · 맛", "메뉴 · 가격", "소개글", "사진"];

type Draft = Partial<NewStoreInput> & Pick<NewStoreInput, "name" | "address" | "rice" | "menu" | "photos">;

const EMPTY: Draft = { name: "", address: "", rice: [], menu: [{ name: "", price: 0 }], photos: [] };

// 순서대로 살펴서 처음 걸리는 칸으로 데려간다 (경고창#1)
const CHECKS: { step: number; field: string; problem: (r: Draft) => string | null }[] = [
  { step: 0, field: "reg-name", problem: (r) => (r.name.trim() ? null : "가게 이름을 넣어 주세요") },
  { step: 0, field: "reg-grade", problem: (r) => (r.grade ? null : "떡볶이를 어떻게 파는지 골라 주세요") },
  { step: 0, field: "reg-address", problem: (r) => (r.address.trim() ? null : "주소를 넣어 주세요") },
  { step: 1, field: "reg-rice", problem: (r) => (r.rice.length ? null : "떡을 하나 이상 골라 주세요") },
  { step: 1, field: "reg-style", problem: (r) => (r.style ? null : "스타일을 골라 주세요") },
  { step: 1, field: "reg-spice", problem: (r) => (r.spice ? null : "대표 메뉴 맵기를 골라 주세요") },
  { step: 2, field: "reg-menu", problem: (r) => (!r.menu[0].name.trim() ? "대표 메뉴 이름을 넣어 주세요" : !r.menu[0].price ? "대표 메뉴 가격을 넣어 주세요" : null) },
  { step: 3, field: "reg-intro", problem: (r) => (r.memo ? checkIntro(r.memo) : null) },
  { step: 4, field: "reg-photos", problem: (r) => (r.photos.length >= MIN_PHOTOS ? null : `간판이나 메뉴판 사진을 ${MIN_PHOTOS}장 이상 올려 주세요`) },
];

// 쓰던 내용은 이 기기에 남겨 두고, 돌아오면 이어서 쓸 수 있게 한다
const DRAFT_KEY = "ddy-register-draft";
const noSubscribe = () => () => undefined;
const readDraft = () => {
  try {
    return localStorage.getItem(DRAFT_KEY);
  } catch {
    return null;
  }
};
const writeDraft = (v: string | null) => {
  try {
    if (v === null) localStorage.removeItem(DRAFT_KEY);
    else localStorage.setItem(DRAFT_KEY, v);
  } catch {
    // 시크릿 창 등에서 막혀도 등록은 그대로 된다
  }
};

export default function RegisterForm({ stores }: { stores: Store[] }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [r, setR] = useState<Draft>(EMPTY);
  const [touched, setTouched] = useState(false);
  const [draftClosed, setDraftClosed] = useState(false);
  const [mapKey, setMapKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dup, setDup] = useState<string | null>(null); // 80m 안 같은 이름의 가게 id
  const [doneId, setDoneId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const saved = useSyncExternalStore(noSubscribe, readDraft, () => null);
  const bar = useRef<HTMLDivElement>(null);

  const set = (p: Partial<Draft>) => {
    setTouched(true);
    setError(null);
    setDup(null);
    setR((cur) => ({ ...cur, ...p }));
  };

  useEffect(() => {
    if (touched && !doneId) writeDraft(JSON.stringify({ r, step }));
  }, [r, step, touched, doneId]);

  // 폰 키보드가 올라와도 아래 단추가 가려지지 않게 그만큼 올린다 (아이폰 사파리는 화면 높이가 그대로라 따로 잰다)
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const fit = () => bar.current?.style.setProperty("--kb", `${Math.max(0, window.innerHeight - vv.height - vv.offsetTop)}px`);
    vv.addEventListener("resize", fit);
    vv.addEventListener("scroll", fit);
    fit();
    return () => {
      vv.removeEventListener("resize", fit);
      vv.removeEventListener("scroll", fit);
    };
  }, []);

  const goTo = (c: (typeof CHECKS)[number], msg: string) => {
    setError(msg);
    setStep(c.step);
    requestAnimationFrame(() => {
      const el = document.getElementById(c.field);
      el?.scrollIntoView({ block: "center", behavior: "smooth" });
      (el?.matches("input,textarea") ? el : el?.querySelector<HTMLElement>("input,textarea,button"))?.focus({ preventScroll: true });
    });
  };

  const submit = async (notDuplicate = false) => {
    for (const c of CHECKS) {
      const msg = c.problem(r);
      if (msg) return goTo(c, msg);
    }
    const e = checkNewStore(r);
    if (e) return setError(e);
    setSending(true);
    setError(null);
    const res = await send("/api/stores", { ...r, memo: r.memo?.trim() || undefined, notDuplicate });
    setSending(false);
    if (!res.ok) {
      setDup(res.existing ?? null);
      return setError(res.error ?? "올리지 못했어요. 쓴 내용은 그대로 있으니 잠시 뒤 다시 해 주세요");
    }
    addMyReport({ kind: "new", storeId: res.id, name: r.name.trim() });
    writeDraft(null);
    setDoneId(res.id!);
    router.refresh(); // 지도·목록이 새 가게를 바로 보게 한다
  };

  // 폰: 이 단계만 살피고 다음으로
  const next = () => {
    for (const c of CHECKS.filter((x) => x.step === step)) {
      const msg = c.problem(r);
      if (msg) return goTo(c, msg);
    }
    setError(null);
    setDup(null);
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      window.scrollTo({ top: 0 });
    } else submit();
  };

  if (doneId)
    return (
      <div className="mx-auto max-w-[480px] px-6 py-16 text-center">
        <p className="text-[40px]" aria-hidden="true">
          🍢
        </p>
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

  const only = (i: number) => (step === i ? "" : "max-md:hidden"); // 폰에서는 지금 단계만 보인다
  const title = "text-[18px] font-bold md:text-[16px]";
  const hint = "text-[12px] font-normal text-ink3";
  const done = [
    !!(r.name.trim() && r.grade && r.address.trim()),
    !!(r.rice.length && r.style && r.spice),
    !!(r.menu[0].name.trim() && r.menu[0].price),
    !!r.memo?.trim(),
    r.photos.length >= MIN_PHOTOS,
  ];

  const message = error && (
    <div role="alert" className="mb-2 text-[13px] text-spicytext">
      <p>{error}</p>
      {dup && (
        <div className="mt-2 flex gap-2">
          <Link href={`/store/${dup}`} className="grid h-10 flex-1 place-items-center rounded-xl border border-ink2 bg-surface text-[14px] font-bold text-ink">
            그 가게 보기
          </Link>
          <button type="button" onClick={() => submit(true)} disabled={sending} className="h-10 flex-1 rounded-xl border border-chipline bg-surface text-[14px] text-ink2 disabled:opacity-50">
            다른 가게예요
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div ref={bar} className="flex min-h-[calc(100dvh-48px)] flex-col px-5 pt-4 md:block md:min-h-0 md:px-0 md:pt-0">
      {saved && !touched && !draftClosed && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl bg-chip px-3 py-2.5 text-[13px] text-ink2">
          <span className="min-w-0 flex-1">쓰다 만 등록이 있어요.</span>
          <button
            type="button"
            className="h-9 rounded-lg bg-primary px-3 font-bold text-onprimary"
            onClick={() => {
              const d = JSON.parse(saved) as { r: Draft; step: number };
              setR({ ...EMPTY, ...d.r });
              setStep(d.step ?? 0);
              setMapKey((k) => k + 1);
              setDraftClosed(true);
            }}
          >
            이어서 쓰기
          </button>
          <button
            type="button"
            className="h-9 rounded-lg border border-chipline bg-surface px-3"
            onClick={() => {
              writeDraft(null);
              setDraftClosed(true);
            }}
          >
            새로 쓰기
          </button>
        </div>
      )}

      {/* 폰: 위 진행 막대 */}
      <ol className="flex gap-1 md:hidden" aria-label={`${STEPS.length}단계 중 ${step + 1}단계`}>
        {STEPS.map((s, i) => (
          <li key={s} className="flex-1">
            <span className={`block h-1 rounded-full ${i <= step ? "bg-primary" : "bg-chipline"}`} />
            <span className={`mt-1 block text-[11px] leading-tight ${i === step ? "font-bold text-ink" : "text-ink3"}`}>{s}</span>
          </li>
        ))}
      </ol>

      <div className="mt-6 flex flex-1 flex-col gap-4 md:mt-0 md:grid md:grid-cols-2 md:gap-6 lg:grid-cols-[150px_minmax(0,1fr)_minmax(0,1fr)] lg:gap-7">
        {/* 1024 이상: 왼쪽 진행 표시. 누르면 그 칸으로, 채운 칸은 ✓ */}
        <nav aria-label="등록 칸" className="hidden self-start lg:sticky lg:top-[72px] lg:flex lg:flex-col lg:gap-2.5 lg:text-[14px]">
          {STEPS.map((s, i) => (
            <a key={s} href={`#reg-${i}`} className={done[i] ? "text-ink3" : i === done.indexOf(false) ? "font-bold text-ink" : "text-ink3"}>
              {i + 1}. {s} {done[i] && "✓"}
            </a>
          ))}
        </nav>

        {/* 입력 */}
        <div className="flex flex-col gap-8 md:min-w-0">
          <section id="reg-0" className={`flex scroll-mt-20 flex-col gap-4 ${only(0)}`}>
            <h2 className={title}>어떤 가게인가요?</h2>
            <label className="text-[13px] text-ink3">
              가게 이름
              <input id="reg-name" value={r.name} onChange={(e) => set({ name: e.target.value })} maxLength={60} placeholder="간판 그대로 적어 주세요" className={INPUT} />
            </label>
            <div id="reg-grade">
              <p className="mb-1.5 text-[13px] text-ink3">떡볶이를 어떻게 파나요?</p>
              <div className="flex flex-wrap gap-2">
                {keysOf(GRADES).map((k) => (
                  <Choice key={k} on={r.grade === k} onClick={() => set({ grade: k })}>
                    {GRADES[k]}
                  </Choice>
                ))}
              </div>
            </div>
            <label className="text-[13px] text-ink3">
              주소
              <input id="reg-address" value={r.address} onChange={(e) => set({ address: e.target.value })} maxLength={120} placeholder="예: 서울 마포구 망원동 123" className={INPUT} />
            </label>
          </section>

          <section id="reg-1" className={`flex scroll-mt-20 flex-col gap-5 ${only(1)}`}>
            <h2 className={`${title} max-md:hidden`}>떡과 맛</h2>
            <div id="reg-rice">
              <h3 className="mb-2 text-[15px] font-bold">
                떡 <span className={hint}>여러 개</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {keysOf(RICE_CAKES).map((k: RiceCake) => (
                  <Choice key={k} on={r.rice.includes(k)} onClick={() => set({ rice: r.rice.includes(k) ? r.rice.filter((x) => x !== k) : [...r.rice, k] })}>
                    {RICE_CAKES[k]}
                  </Choice>
                ))}
              </div>
            </div>
            <div id="reg-style">
              <h3 className="mb-2 text-[15px] font-bold">
                스타일 <span className={hint}>하나</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {keysOf(STYLES).map((k) => (
                  <Choice key={k} on={r.style === k} onClick={() => set({ style: k })}>
                    {STYLES[k]}
                  </Choice>
                ))}
              </div>
            </div>
            <div id="reg-spice">
              <h3 className="mb-2 text-[15px] font-bold">
                맵기 <span className={hint}>대표 메뉴 기준 · 신라면 = 3</span>
              </h3>
              <SpiceInput value={r.spice} onChange={(spice) => set({ spice })} />
            </div>
            <div>
              <h3 className="mb-2 text-[15px] font-bold">
                가게는 어땠어요? <span className={hint}>선택</span>
              </h3>
              <StarInput value={r.stars} onChange={(stars) => set({ stars })} />
            </div>
          </section>

          <section id="reg-2" className={`flex scroll-mt-20 flex-col gap-4 ${only(2)}`}>
            <div>
              <h2 className={title}>메뉴와 가격</h2>
              <p className="mt-1 text-[13px] text-ink3">대표 메뉴 하나면 충분해요. 나머지는 나중에 누구나 더할 수 있어요.</p>
            </div>
            <div id="reg-menu">
              <MenuEditor menu={r.menu} onChange={(menu) => set({ menu })} />
            </div>
            <div>
              <h3 className="mb-2 text-[15px] font-bold">
                영업시간 <span className={hint}>선택</span>
              </h3>
              <HoursField value={r.hours ?? null} onChange={(hours) => set({ hours: hours ?? undefined })} />
            </div>
          </section>

          <section id="reg-3" className={`flex scroll-mt-20 flex-col gap-3 ${only(3)}`}>
            <h2 className={title}>
              이 집을 소개해 주세요 <span className={hint}>선택</span>
            </h2>
            <IntroField id="reg-intro" value={r.memo ?? ""} onChange={(memo) => set({ memo })} />
          </section>
        </div>

        {/* 지도 · 사진 · 올리기. 폰에서는 지도가 1단계, 사진이 5단계에 나온다 */}
        <div className="flex flex-col gap-6 md:min-w-0">
          <div className={only(0)}>
            <p className="mb-1.5 text-[13px] text-ink3">가게 위치</p>
            <MapPicker key={mapKey} stores={stores} start={mapKey && r.lat !== undefined && r.lng !== undefined ? { lat: r.lat, lng: r.lng } : undefined} onChange={(p) => setR((cur) => ({ ...cur, ...p }))} tall />
          </div>
          <section id="reg-4" className={`flex scroll-mt-20 flex-col gap-5 ${only(4)}`}>
            <div id="reg-photos">
              <h2 className={title}>사진을 올려 주세요</h2>
              <p className="mt-1 mb-3 text-[13px] text-ink3">간판이나 메뉴판 {MIN_PHOTOS}장 이상 · 진짜 있는 가게인지 확인하는 데 써요</p>
              <PhotoPicker ids={r.photos} onChange={(photos) => set({ photos })} hint="사람 얼굴이 크게 나오지 않게 찍어 주세요. 찍은 위치 정보는 지워서 올려요." />
            </div>
            <NickField />
            <p className="rounded-xl bg-chip px-3 py-2 text-[12px] leading-relaxed text-ink2">
              올리면 바로 지도에 나오고, {VERIFY_DAYS}일 동안 「확인 중」으로 보여요. 사실과 다르면 다른 사람이 고치거나 신고할 수 있어요.
            </p>
            <div className="max-md:hidden">
              {message}
              <button type="button" onClick={() => submit()} disabled={sending} className="h-12 w-full rounded-xl bg-accent text-[16px] font-bold text-onaccent disabled:opacity-50">
                {sending ? "올리는 중…" : "지도에 올리기"}
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* 폰: 아래에 붙는 단추. 입력 중에도 보인다 */}
      <div className="sticky bottom-[var(--kb,0px)] z-10 -mx-5 mt-4 bg-paper px-5 pt-2 pb-[calc(env(safe-area-inset-bottom)+12px)] md:hidden">
        {message}
        <div className="flex gap-2">
          {step > 0 && (
            <button
              type="button"
              onClick={() => {
                setError(null);
                setDup(null);
                setStep(step - 1);
                window.scrollTo({ top: 0 });
              }}
              className="h-12 flex-1 rounded-xl border border-chipline bg-surface text-[15px] text-ink2"
            >
              이전
            </button>
          )}
          {step === 3 && !r.memo?.trim() && (
            <button type="button" onClick={next} className="h-12 flex-1 rounded-xl border border-chipline bg-surface text-[15px] text-ink2">
              건너뛰기
            </button>
          )}
          <button type="button" onClick={next} disabled={sending} className="h-12 flex-[2] rounded-xl bg-accent text-[16px] font-bold text-onaccent disabled:opacity-50">
            {step < STEPS.length - 1 ? "다음" : sending ? "올리는 중…" : "지도에 올리기"}
          </button>
        </div>
      </div>
    </div>
  );
}
