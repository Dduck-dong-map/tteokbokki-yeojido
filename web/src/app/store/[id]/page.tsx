import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import FlipStamp from "@/components/store/FlipStamp";
import SaveButton from "@/components/store/SaveButton";
import { AddPhoto, CopyAddress, FlagReviewButton, MoreActions, ReviewForm, StillHere, VerifyBar } from "@/components/store/StoreActions";
import { BackHeader, Chili, PendingTag, SampleRibbon, Stars, Tag } from "@/components/ui";
import { getReviews, getStore, getStores } from "@/lib/data";
import { kakaoDirections, naverDirections } from "@/lib/directions";
import { won } from "@/lib/filters";
import { confirmedAgo, freshness, hoursText } from "@/lib/freshness";
import { GRADES, RICE_CAKES, SHOP_TYPES, SIDES, SPICE_LEVELS, STALE_DAYS, STYLES, TASTES, USAGES } from "@/lib/taxonomy";
import { isPending } from "@/lib/wiki";

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

// 가게 상세 (거지맵 구도 MVP, 11-04)
// 첫 칸은 팀 순서 그대로: 이름 → 위치 → 떡볶이 종류 → 맵기 → 대표 가격 → 길찾기.
// 그 아래로 사진 · 메뉴 · 평가 · 고치기가 이어진다.
export default function StorePage({ params }: PageProps<"/store/[id]">) {
  return (
    <Suspense fallback={<div className="mx-auto min-h-dvh max-w-[480px] bg-paper"><BackHeader title="" /></div>}>
      <StoreLoader params={params} />
    </Suspense>
  );
}

async function StoreLoader({ params }: Pick<PageProps<"/store/[id]">, "params">) {
  await connection(); // 누가 고치면 바로 보여야 하므로 요청 때마다 새로 읽는다
  return <StoreDetail id={(await params).id} />;
}

async function StoreDetail({ id }: { id: string }) {
  const [s, reviews] = await Promise.all([getStore(id), getReviews(id)]);
  if (!s) notFound();
  const now = new Date();
  const fresh = freshness(s, now);
  const pending = isPending(s, now);
  const gone = (s.status ?? "active") !== "active";
  const written = reviews.filter((r) => r.text);

  return (
    <div className="mx-auto min-h-dvh max-w-[480px] bg-paper pb-10">
      {/* 오른쪽 ♡ → 「내 맛지도」에 저장. 이 기기에만, 로그인 없음 (보드 N3-05, 11-02) */}
      <BackHeader title={s.name} right={<SaveButton id={s.id} name={s.name} />} />
      {s.isSample && (
        <div className="flex justify-center pt-3">
          <SampleRibbon />
        </div>
      )}

      {gone && (
        <p className="mx-4 mt-3 rounded-xl bg-spicybg px-3 py-2 text-[13px] text-spicytext">
          {s.status === "closed" ? "문을 닫았다는 신고가 쌓여 지도에서 내렸어요." : "사실과 다르다는 의견이 쌓여 지도에서 내렸어요."}
        </p>
      )}
      {!gone && fresh !== "fresh" && (
        <p className="mx-4 mt-3 rounded-xl bg-chip px-3 py-2 text-[13px] text-ink2">
          오래된 정보일 수 있어요. 마지막 확인이 {STALE_DAYS}일을 넘었어요.
        </p>
      )}

      <section className="mx-4 mt-3 rounded-2xl border border-line bg-surface p-4">
        <p className="flex items-center gap-1.5 text-[12px] text-ink3">
          {GRADES[s.grade]}
          {s.shopType && ` · ${SHOP_TYPES[s.shopType]}`}
          {pending && <PendingTag />}
        </p>
        <div className="mt-0.5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-[21px] font-bold leading-tight">{s.name}</h2>
            <div className="mt-1">
              <Stars rating={s.rating} size={13} />
            </div>
            <p className="mt-1.5 text-[13px] text-ink2">
              {s.address.includes(s.dong) ? s.address : `${s.dong} · ${s.address}`}
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

      {pending && !gone && <VerifyBar id={s.id} by={s.by} yes={s.verify?.yes ?? 0} no={s.verify?.no ?? 0} />}

      {s.photos?.length ? (
        <div className="mt-3 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none]">
          {s.photos.map((p) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={p} src={`/api/photos/${p}`} alt={`${s.name} 사진`} className="h-32 w-40 shrink-0 rounded-xl border border-line object-cover" />
          ))}
          <AddPhoto id={s.id} />
        </div>
      ) : (
        <div className="mx-4 mt-3">
          <AddPhoto id={s.id} large />
        </div>
      )}

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

      <dl className="mx-4 mt-4 divide-y divide-line rounded-2xl border border-line bg-surface px-4">
        {s.taste.length > 0 && <Row label="맛 결">{s.taste.map((t) => <Tag key={t}>{TASTES[t]}</Tag>)}</Row>}
        {s.sides.length > 0 && <Row label="같이 먹기">{s.sides.map((x) => <Tag key={x}>{SIDES[x]}</Tag>)}</Row>}
        {s.usage.length > 0 && <Row label="이용">{s.usage.map((u) => <Tag key={u}>{USAGES[u]}</Tag>)}</Row>}
        <Row label="영업">
          {s.hours ? (
            hoursText(s.hours)
          ) : (
            <Link href={`/store/${s.id}/edit`} className="text-ink2 underline underline-offset-2">
              + 영업시간 채우기
            </Link>
          )}
        </Row>
        {s.memo && <Row label="메모">{s.memo}</Row>}
        <Row label="주소">
          <span className="flex-1">{s.address}</span>
          <CopyAddress address={s.address} />
        </Row>
      </dl>

      {/* 평가: 두 축 (슬랙 10-28) — 가게는 별, 맛은 맵기(고추) */}
      <section className="mx-4 mt-4 rounded-2xl border border-line bg-surface px-4 py-3">
        <h3 className="text-[15px] font-bold">가 본 사람들의 평가</h3>
        <div className="mt-2 flex items-center gap-4 text-[14px]">
          <Stars rating={s.rating} size={15} />
          <span className="text-ink2">
            맵기 {s.spice}
            {s.spiceVotes && s.spiceVotes.count > 1 && <span className="text-ink3"> · {s.spiceVotes.count}명 투표</span>}
          </span>
        </div>
        <ReviewForm id={s.id} />
        {written.length > 0 && (
          <ul className="mt-3 divide-y divide-line">
            {written.map((r) => (
              <li key={r.id} className="py-2.5">
                <p className="flex flex-wrap items-center gap-x-1.5 text-[12px] text-ink3">
                  <b className="font-semibold text-ink2">{r.who}</b>
                  {r.stars && <span className="text-[#D98E04]">★{r.stars}</span>}
                  {r.spice && (
                    <span className="inline-flex items-center gap-[1px]">
                      {Array.from({ length: r.spice }, (_, i) => <Chili key={i} h={10} />)}
                    </span>
                  )}
                  <span>· {confirmedAgo(r.at.slice(0, 10), now)}</span>
                  <span className="ml-auto">
                    <FlagReviewButton storeId={s.id} reviewId={r.id} />
                  </span>
                </p>
                <p className="mt-1 text-[14px]">{r.text}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mx-4 mt-4 flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-3">
        <div>
          <p className="text-[13px] text-ink3">마지막 확인</p>
          <p className="text-[15px] font-bold">{confirmedAgo(s.lastConfirmedAt, now)}</p>
        </div>
        <StillHere id={s.id} lat={s.lat} lng={s.lng} />
      </section>

      <MoreActions id={s.id} name={s.name} />
    </div>
  );
}
