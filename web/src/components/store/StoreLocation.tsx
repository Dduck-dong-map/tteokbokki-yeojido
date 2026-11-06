"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMemo, useState } from "react";
import TteokMap from "@/components/map/TteokMap";
import { distanceM, distanceText } from "@/lib/filters";
import { useGrantedLocation, useIsWide } from "@/lib/screen";
import type { Store } from "@/lib/types";

const noop = () => undefined;

// 「위치」 제목 + 작은 지도 (보드 N-05 · 웹 1차 기획 REQ-W07).
// 폰에서만 그린다. PC는 옆의 큰 지도가 이 자리를 대신한다.
// 지도는 움직이지 않아서 그 위에서 밀어도 페이지가 스크롤되고, 누르면 큰 지도가 그 가게에서 열린다.
export function StoreMiniMap({ store }: { store: Store }) {
  const wide = useIsWide();
  const stores = useMemo(() => [store], [store]);
  const href = `/?store=${store.id}`;
  if (wide) return null;
  return (
    <>
      <div className="flex items-center justify-between md:hidden">
        <h2 className="text-[16px] font-bold">위치</h2>
        <Link href={href} className="text-[13px] font-bold text-accent">
          지도 크게 보기
        </Link>
      </div>
      <Link href={href} aria-label={`${store.name} 지도 크게 보기`} className="relative block h-[236px] overflow-hidden rounded-[14px] border border-line bg-paper md:hidden">
        <div className="pointer-events-none absolute inset-0">
          <TteokMap stores={stores} selectedId={null} onSelect={noop} me={null} focus={null} start={{ lat: store.lat, lng: store.lng, zoom: 17 }} interactive={false} showName />
        </div>
      </Link>
    </>
  );
}

// 머리글의 거리: 위치를 이미 허용한 기기에서만, 기기 안에서 잰다 (REQ-W07)
export function StoreDistance({ lat, lng }: { lat: number; lng: number }) {
  const me = useGrantedLocation();
  return me ? <> · {distanceText(distanceM(me, { lat, lng }))}</> : null;
}

// 머리칸 왼쪽: 폰은 ‹ 뒤로, 768 이상은 × 패널 닫기. 지도에 걸어 둔 필터는 그대로 돌아간다.
export function CloseStore() {
  const router = useRouter();
  return (
    <Link
      href="/"
      onClick={(e) => {
        e.preventDefault();
        router.push(`/${window.location.search}`);
      }}
      aria-label="지도로 돌아가기"
      className="grid h-10 w-10 place-items-center rounded-full text-xl text-ink hover:bg-chip"
    >
      <span className="md:hidden">‹</span>
      <span className="hidden text-[20px] md:inline">×</span>
    </Link>
  );
}

// 머리칸 오른쪽 공유: 폰은 공유 창, PC는 주소 복사
export function ShareButton({ name }: { name: string }) {
  const [done, setDone] = useState(false);
  const share = async () => {
    const url = window.location.href.split("?")[0];
    try {
      if (navigator.share) await navigator.share({ title: name, url });
      else {
        await navigator.clipboard.writeText(url);
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }
    } catch {
      // 공유 창을 닫은 경우
    }
  };
  return (
    <button type="button" onClick={share} aria-label={`${name} 공유`} title={done ? "주소를 복사했어요" : "공유"} className="grid h-10 w-10 place-items-center rounded-full text-ink hover:bg-chip">
      {done ? (
        <span className="text-[16px]">✓</span>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
        </svg>
      )}
    </button>
  );
}
