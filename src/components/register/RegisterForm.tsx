"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { send } from "@/lib/me";
import { addMyReport } from "@/lib/mine";
import type { Store } from "@/lib/types";
import { MIN_PHOTOS, checkIntro, checkNewStore } from "@/lib/wiki";
import RegisterFormView from "./RegisterFormView";
import type { LatLng, RegisterDraft } from "./types";

// 맛집 등록 컨테이너 (보드 WB-02 · 웹 1차 기획 M-W-03 · 리팩토링 계획 2026-11-09 · 7-1 형태 2).
// 단계·입력값·검사·보내기·임시 저장·키보드 높이는 전부 여기서 끝내고, 그리는 일은 RegisterFormView 가 props 만 받아서 한다.
// 보내면 승인 없이 바로 지도에 올라간다.
const STEPS = ["가게 · 위치", "떡 · 맛", "메뉴 · 가격", "소개글", "사진"] as const;

const EMPTY: RegisterDraft = { name: "", address: "", rice: [], menu: [{ name: "", price: 0 }], photos: [] };

// 순서대로 살펴서 처음 걸리는 칸으로 데려간다 (경고창#1). field 는 View 가 그리는 요소의 id.
const CHECKS: { step: number; field: string; problem: (r: RegisterDraft) => string | null }[] = [
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
  const [r, setR] = useState<RegisterDraft>(EMPTY);
  const [touched, setTouched] = useState(false);
  const [draftClosed, setDraftClosed] = useState(false);
  const [mapKey, setMapKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dup, setDup] = useState<string | null>(null); // 80m 안 같은 이름의 가게 id
  const [doneId, setDoneId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const saved = useSyncExternalStore(noSubscribe, readDraft, () => null);
  const bar = useRef<HTMLDivElement>(null);

  const set = (p: Partial<RegisterDraft>) => {
    setTouched(true);
    setError(null);
    setDup(null);
    setR((cur) => ({ ...cur, ...p }));
  };

  // 지도 가운데 핀: 손댄 것으로 치지 않는다 (지도만 움직여도 임시 저장이 시작되지 않게)
  const onPosition = (p: LatLng) => setR((cur) => ({ ...cur, ...p }));

  useEffect(() => {
    if (touched && !doneId) writeDraft(JSON.stringify({ r, step }));
  }, [r, step, touched, doneId]);

  // 폰 키보드가 올라와도 아래 단추가 가려지지 않게 그만큼 올린다 (아이폰 사파리는 화면 높이가 그대로라 따로 잰다).
  // --kb 는 감싸는 div 에 심고, View 의 sticky 단추(bottom-[var(--kb,0px)])가 상속받아 읽는다.
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

  const prev = () => {
    setError(null);
    setDup(null);
    setStep(step - 1);
    window.scrollTo({ top: 0 });
  };

  // 「쓰다 만 등록」 띠: 이어서 쓰면 지도도 저장된 자리로 다시 그린다(mapKey)
  const onResumeDraft = () => {
    if (!saved) return;
    const d = JSON.parse(saved) as { r: RegisterDraft; step: number };
    setR({ ...EMPTY, ...d.r });
    setStep(d.step ?? 0);
    setMapKey((k) => k + 1);
    setDraftClosed(true);
  };
  const onDiscardDraft = () => {
    writeDraft(null);
    setDraftClosed(true);
  };

  // 단계마다 채웠는지 (PC 왼쪽 진행 표시 ✓)
  const done = [
    !!(r.name.trim() && r.grade && r.address.trim()),
    !!(r.rice.length && r.style && r.spice),
    !!(r.menu[0].name.trim() && r.menu[0].price),
    !!r.memo?.trim(),
    r.photos.length >= MIN_PHOTOS,
  ];

  return (
    <div ref={bar}>
      <RegisterFormView
        stores={stores}
        step={step}
        steps={STEPS}
        draft={r}
        done={done}
        touched={touched}
        hasSavedDraft={!!saved}
        draftClosed={draftClosed}
        mapKey={mapKey}
        error={error}
        dupId={dup}
        doneId={doneId}
        sending={sending}
        onChange={set}
        onPosition={onPosition}
        onNext={next}
        onPrev={prev}
        onSubmit={submit}
        onResumeDraft={onResumeDraft}
        onDiscardDraft={onDiscardDraft}
      />
    </div>
  );
}
