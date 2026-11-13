"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { distanceM } from "@/lib/filters";
import { send, uploadPhoto } from "@/lib/me";
import { HIDE_AT, checkReview, type FlagReason } from "@/lib/wiki";
import AddPhotoView from "./AddPhotoView";
import CopyAddressView from "./CopyAddressView";
import FlagReviewButtonView from "./FlagReviewButtonView";
import GoLinksView from "./GoLinksView";
import MoreActionsView from "./MoreActionsView";
import ReviewFormView from "./ReviewFormView";
import StillHereView from "./StillHereView";
import VerifyBarView from "./VerifyBarView";
import VerifyButtonsView from "./VerifyButtonsView";

// 가게 상세 동작 부품의 컨테이너 모음 (리팩토링 계획 2026-11-09 · 7-1 형태 2).
// 여기서는 상태·핸들러·fetch·router 만 다루고, 마크업은 같은 폴더의 *View 가 맡는다(계약: ./types.ts).
// 서버 페이지는 이 파일의 export 이름과 props 를 그대로 쓰므로 시그니처는 바꾸지 않는다.

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

  return <StillHereView busy={busy} message={msg} onPress={press} />;
}

export function CopyAddress({ address }: { address: string }) {
  const [done, setDone] = useState(false);

  const copy = () => {
    navigator.clipboard?.writeText(address).then(() => {
      setDone(true);
      setTimeout(() => setDone(false), 1500);
    });
  };

  return <CopyAddressView copied={done} onCopy={copy} />;
}

// 길찾기 두 링크 + 누름 기록 (W1-4, KPI-W01). 기록은 보내기만 하고 결과는 기다리지 않는다.
export function GoLinks({ id, naver, kakao }: { id: string; naver: string; kakao: string }) {
  const go = (app: "naver" | "kakao") => {
    void send(`/api/stores/${id}`, { action: "go", app });
  };
  return <GoLinksView naver={naver} kakao={kakao} onGo={go} />;
}

// 「맞아요」「달라요」 투표 상태. VerifyButtons 와 VerifyBar 가 같은 로직을 쓴다.
function useVerify(id: string) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const onVote = async (ok: boolean) => {
    setBusy(true);
    const res = await send(`/api/stores/${id}`, { action: "verify", ok });
    setBusy(false);
    setMessage(res.ok ? "알려 주셔서 고마워요!" : (res.error ?? "보내지 못했어요"));
    if (res.ok) router.refresh();
  };

  return { busy, message, onVote };
}

// 새로 올라온 가게: 가 본 사람이 「맞아요」「달라요」로 걸러 낸다
export function VerifyButtons({ id, compact = false }: { id: string; compact?: boolean }) {
  const verify = useVerify(id);
  return <VerifyButtonsView {...verify} compact={compact} />;
}

export function VerifyBar({ id, by, yes, no }: { id: string; by?: string; yes: number; no: number }) {
  const verify = useVerify(id);
  return <VerifyBarView by={by} yes={yes} no={no} verify={verify} />;
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

  return <AddPhotoView busy={busy} message={msg} large={large} onFiles={pick} />;
}

// 평가 남기기: 별점(필수) + 한 줄 후기 (기기마다 하나, 다시 쓰면 바뀐다). 맵기는 정보 고치기에서 고친다.
// 서버와 같은 규칙(lib/wiki checkReview)으로 먼저 거른 뒤 보낸다.
export function ReviewForm({ id }: { id: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [stars, setStars] = useState<number | undefined>();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const problem = checkReview({ stars, text });
    if (problem) return setError(problem);
    setBusy(true);
    const res = await send(`/api/stores/${id}`, { action: "review", stars, text });
    setBusy(false);
    if (!res.ok) return setError(res.error ?? "보내지 못했어요");
    setOpen(false);
    setError(null);
    router.refresh();
  };

  return (
    <ReviewFormView
      open={open}
      stars={stars}
      text={text}
      error={error}
      busy={busy}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      onStarsChange={setStars}
      onTextChange={setText}
      onSubmit={submit}
    />
  );
}

export function FlagReviewButton({ storeId, reviewId }: { storeId: string; reviewId: string }) {
  const [msg, setMsg] = useState<string | null>(null);

  const flag = async () => {
    const res = await send(`/api/stores/${storeId}`, { action: "flag-review", reviewId });
    setMsg(res.ok ? "신고했어요" : (res.error ?? "보내지 못했어요"));
  };

  return <FlagReviewButtonView message={msg} onFlag={flag} />;
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

  return <MoreActionsView storeId={id} flagOpen={flagOpen} message={msg} onShare={share} onToggleFlag={() => setFlagOpen((v) => !v)} onFlag={flag} />;
}
