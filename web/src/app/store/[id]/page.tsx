import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import FlipStamp from "@/components/store/FlipStamp";
import SaveButton from "@/components/store/SaveButton";
import { StillHere, CopyAddress } from "@/components/store/StoreActions";
import { BackHeader, SampleRibbon, Stars, Tag } from "@/components/ui";
import { getStore, getStores } from "@/lib/data";
import { kakaoDirections, naverDirections } from "@/lib/directions";
import { won } from "@/lib/filters";
import { confirmedAgo, freshness, hoursText } from "@/lib/freshness";
import { GRADES, RICE_CAKES, SHOP_TYPES, SIDES, SPICE_LEVELS, STALE_DAYS, STYLES, TASTES, USAGES } from "@/lib/taxonomy";

export async function generateStaticParams() {
  return (await getStores()).map((s) => ({ id: s.id }));
}

export async function generateMetadata({ params }: PageProps<"/store/[id]">): Promise<Metadata> {
  "use cache";
  const s = await getStore((await params).id);
  if (!s) return {};
  return {
    title: s.name,
    description: `${s.dong} ${STYLES[s.style]}떡볶이 · ${s.rice.map((r) => RICE_CAKES[r]).join("·")} · 맵기 ${s.spice} (${SPICE_LEVELS[s.spice].ref}) · 1인분 ${won(s.price)}`,
  };
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 py-2.5">
      <dt className="w-16 shrink-0 text-[13px] text-ink3">{label}</dt>
      <dd className="flex flex-1 flex-wrap items-center gap-1.5 text-[14px]">{children}</dd>
    </div>
  );
}

// 가게 상세 (기획안 5·6절)
// 주소 값(params)은 Suspense 안에서 읽는다 → 화면 틀이 먼저 뜨고 내용이 이어서 온다 (Next 16 권장)
export default function StorePage({ params }: PageProps<"/store/[id]">) {
  return (
    <Suspense fallback={<div className="mx-auto min-h-dvh max-w-[480px] bg-paper"><BackHeader title="" /></div>}>
      <StoreLoader params={params} />
    </Suspense>
  );
}

async function StoreLoader({ params }: Pick<PageProps<"/store/[id]">, "params">) {
  return <StoreDetail id={(await params).id} />;
}

// 신선도 띠가 날마다 바뀌도록 한 시간 단위로 다시 만든다
async function StoreDetail({ id }: { id: string }) {
  "use cache";
  cacheLife("hours");

  const s = await getStore(id);
  if (!s) notFound();
  const now = new Date();
  const fresh = freshness(s, now);

  return (
    <div className="mx-auto min-h-dvh max-w-[480px] bg-paper pb-10">
      {/* 오른쪽 ♡ → 「내 맛지도」(아래 메뉴 셋째 탭)에 저장. 이 기기에만, 로그인 없음 (보드 N3-05, 11-02) */}
      <BackHeader title={s.name} right={<SaveButton id={s.id} name={s.name} />} />
      {s.isSample && (
        <div className="flex justify-center pt-3">
          <SampleRibbon />
        </div>
      )}

      {fresh !== "fresh" && (
        <p className="mx-4 mt-3 rounded-xl bg-chip px-3 py-2 text-[13px] text-ink2">
          오래된 정보일 수 있어요. 마지막 확인이 {STALE_DAYS}일을 넘었어요.
        </p>
      )}

      {/* 정보 순서(슬랙 10-28, 기획 팀장): 이름 → 위치 → 떡볶이 종류 → 맵기 → 대표 가격 → 길찾기. 길찾기는 첫 화면 안에. */}
      <section className="mx-4 mt-3 rounded-2xl border border-line bg-surface p-4">
        <p className="text-[12px] text-ink3">
          {GRADES[s.grade]} · {SHOP_TYPES[s.shopType]}
        </p>
        <div className="mt-0.5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-[21px] font-bold leading-tight">{s.name}</h2>
            <div className="mt-1">
              <Stars rating={s.rating} size={13} />
            </div>
            <p className="mt-1.5 text-[13px] text-ink2">
              {s.dong} · {s.address}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Tag>{STYLES[s.style]}</Tag>
              {s.rice.map((r) => <Tag key={r}>{RICE_CAKES[r]}</Tag>)}
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-center">
            <FlipStamp n={s.spice} size={60} faded={fresh !== "fresh"} />
            <span className="mt-1 text-[10px] text-ink3">눌러 보세요</span>
          </div>
        </div>
        <p className="mt-2 text-[13px] text-ink2">
          맵기 {s.spice} · {SPICE_LEVELS[s.spice].ref}
          {s.spiceLabel && ` · 가게 단계 「${s.spiceLabel}」`}
        </p>
        <p className="mt-2 flex items-baseline justify-between text-[14px]">
          <span className="text-ink2">{s.menu[0].name}</span>
          <b className="text-[18px]">{won(s.price)}</b>
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <a href={naverDirections(s)} target="_blank" rel="noopener" className="grid h-11 place-items-center rounded-xl bg-accent text-[14px] font-bold text-onaccent">
            네이버 지도로 길찾기
          </a>
          <a href={kakaoDirections(s)} target="_blank" rel="noopener" className="grid h-11 place-items-center rounded-xl border border-ink2 bg-surface text-[14px] font-bold">
            카카오맵으로 길찾기
          </a>
        </div>
      </section>

      <div className="mx-4 mt-3 grid h-32 place-items-center rounded-2xl border border-dashed border-chipline bg-surface text-[13px] text-ink3">
        아직 사진이 없어요 · 제보할 때 올려 주세요
      </div>

      <dl className="mx-4 mt-4 divide-y divide-line rounded-2xl border border-line bg-surface px-4">
        <Row label="맛 결">{s.taste.map((t) => <Tag key={t}>{TASTES[t]}</Tag>)}</Row>
        {s.sides.length > 0 && <Row label="같이 먹기">{s.sides.map((x) => <Tag key={x}>{SIDES[x]}</Tag>)}</Row>}
        {s.usage.length > 0 && <Row label="이용">{s.usage.map((u) => <Tag key={u}>{USAGES[u]}</Tag>)}</Row>}
        <Row label="영업">{hoursText(s.hours)}</Row>
        <Row label="주소">
          <span className="flex-1">{s.address}</span>
          <CopyAddress address={s.address} />
        </Row>
      </dl>

      <section className="mx-4 mt-4 rounded-2xl border border-line bg-surface px-4 py-3">
        <h3 className="flex items-baseline justify-between text-[15px] font-bold">
          메뉴판 <span className="text-[12px] font-normal text-ink3">가격 확인 {confirmedAgo(s.priceCheckedAt, now)}</span>
        </h3>
        <ul className="mt-2 divide-y divide-line">
          {s.menu.map((m) => (
            <li key={m.name} className="flex justify-between py-2 text-[14px]">
              <span>{m.name}</span>
              <b>{won(m.price)}</b>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-4 mt-4 flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-3">
        <div>
          <p className="text-[13px] text-ink3">마지막 확인</p>
          <p className="text-[15px] font-bold">{confirmedAgo(s.lastConfirmedAt, now)}</p>
        </div>
        <StillHere lat={s.lat} lng={s.lng} />
      </section>

      <div className="mx-4 mt-4 flex gap-2 text-[13px]">
        <Link href={`/report?store=${s.id}&kind=edit`} className="grid h-10 flex-1 place-items-center rounded-xl border border-chipline bg-surface text-ink2">
          정보가 달라요
        </Link>
        <Link href={`/report?store=${s.id}&kind=closed`} className="grid h-10 flex-1 place-items-center rounded-xl border border-chipline bg-surface text-ink2">
          문 닫았어요
        </Link>
      </div>

      <p className="mx-4 mt-6 text-center text-[12px] text-ink3">가게 평점은 제보할 때 함께 받아요 · 한 줄 후기는 2차에 열어요</p>
    </div>
  );
}
