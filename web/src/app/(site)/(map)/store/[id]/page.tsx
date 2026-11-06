import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import FlipStamp from "@/components/store/FlipStamp";
import SaveButton from "@/components/store/SaveButton";
import { AddPhoto, CopyAddress, FlagReviewButton, MoreActions, ReviewForm, StillHere, VerifyBar } from "@/components/store/StoreActions";
import { CloseStore, ShareButton, StoreDistance, StoreMiniMap } from "@/components/store/StoreLocation";
import { PendingTag, SampleRibbon, Stars, Tag } from "@/components/ui";
import { getRegion, getReviews, getStore, getStores } from "@/lib/data";
import { kakaoDirections, naverDirections } from "@/lib/directions";
import { won } from "@/lib/filters";
import { confirmedAgo, freshness, hoursText, todayHoursText } from "@/lib/freshness";
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
    description: `${s.dong} ${STYLES[s.style]}떡볶이 · ${s.rice.map((r) => RICE_CAKES[r]).join("·")} · 대표 메뉴 맵기 ${s.spice} (${SPICE_LEVELS[s.spice].ref}) · 1인분 ${won(s.price)}`,
  };
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <dt className="w-16 shrink-0 text-[14px] text-ink3">{label}</dt>
      <dd className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5 text-[14px]">{children}</dd>
    </div>
  );
}

// 칸 사이 줄 (N-05 의 「가게 정보」와 같은 모양)
const SECTION = "flex flex-col gap-2 border-t border-line pt-3.5";

function Head({ name, right }: { name?: string; right?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-line bg-bar px-1.5">
      <CloseStore />
      <p className="text-[16px] font-bold">{name ? "가게 위치" : ""}</p>
      <div className="flex min-w-10 justify-end">{right}</div>
    </header>
  );
}

// 가게 상세 · 위치 · 길찾기 (보드 N-05 + WB-01, 웹 1차 기획 M-W-02)
// 순서: 이름·종류·맵기 도장 → 동·거리·영업 → 대표 가격 → 위치 지도 → 주소 → 길찾기 → 소개글 → 사진 → 메뉴판 → 가게 정보 → 평가 → 마지막 확인 → 고치기 넷.
// PC는 옆 큰 지도가 작은 지도를 대신한다.
export default function StorePage({ params }: PageProps<"/store/[id]">) {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-surface md:min-h-full"><Head /></div>}>
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
  const place = [getRegion(s.gu)?.name, s.dong].filter(Boolean).join(" ");
  const today = todayHoursText(s.hours, now);

  return (
    <div className="min-h-dvh bg-surface pb-10 md:min-h-full">
      {/* 오른쪽 ♡ → 「내 맛지도」에 저장. 이 기기에만, 로그인 없음 (보드 N3-05, 11-02) */}
      <Head
        name={s.name}
        right={
          <>
            <SaveButton id={s.id} name={s.name} />
            <ShareButton name={s.name} />
          </>
        }
      />

      <div className="flex flex-col gap-3.5 p-4">
        {s.isSample && (
          <div className="flex justify-center">
            <SampleRibbon />
          </div>
        )}
        {gone && (
          <p className="rounded-xl bg-spicybg px-3 py-2 text-[13px] text-spicytext">
            {s.status === "closed" ? "문을 닫았다는 신고가 쌓여 지도에서 내렸어요." : "사실과 다르다는 의견이 쌓여 지도에서 내렸어요."}
          </p>
        )}
        {!gone && fresh !== "fresh" && (
          <p className="rounded-xl bg-chip px-3 py-2 text-[13px] text-ink2">오래된 정보일 수 있어요. 마지막 확인이 {STALE_DAYS}일을 넘었어요.</p>
        )}

        {/* 머리: 도장(누르면 표정) + 이름 + 종류 */}
        <div className="flex items-center gap-3">
          <FlipStamp n={s.spice} size={44} faded={fresh !== "fresh"} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
              <h1 className="text-[21px] font-bold leading-tight">{s.name}</h1>
              <span className="rounded border border-chipline px-1.5 py-px text-[11px] font-medium whitespace-nowrap text-ink2">
                {GRADES[s.grade]}
                {s.shopType && ` · ${SHOP_TYPES[s.shopType]}`}
              </span>
              {pending && <PendingTag />}
            </div>
            <p className="mt-0.5 text-[13px] text-ink3">
              {place}
              <StoreDistance lat={s.lat} lng={s.lng} />
              {today && ` · ${today}`}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Tag>{STYLES[s.style]}</Tag>
          {s.rice.map((r) => (
            <Tag key={r}>{RICE_CAKES[r]}</Tag>
          ))}
        </div>

        {/* 대표 가격 · 맵기 */}
        <div>
          <p className="flex items-baseline justify-between gap-3">
            <span className="text-[14px] text-ink2">{s.menu[0].name}</span>
            <b className="text-[19px]">{won(s.price)}</b>
          </p>
          <p className="mt-0.5 text-[12.5px] text-ink3">
            맵기 {s.spice} · {SPICE_LEVELS[s.spice].ref} · 대표 메뉴 기준 · {confirmedAgo(s.priceCheckedAt, now)} 확인
            {s.spiceLabel && ` · 가게 단계 「${s.spiceLabel}」`}
          </p>
        </div>

        <StoreMiniMap store={s} />

        {/* 주소 · 길찾기 */}
        <div className="flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-ink2" aria-hidden="true">
            <path d="M12 21s7-6.2 7-11.5A7 7 0 1 0 5 9.5C5 14.8 12 21 12 21Z" />
            <circle cx="12" cy="9.5" r="2.5" />
          </svg>
          <span className="min-w-0 flex-1 text-[14px]">{s.address}</span>
          <CopyAddress address={s.address} />
        </div>
        <div className="flex gap-2">
          <a href={naverDirections(s)} target="_blank" rel="noopener" className="flex h-[52px] flex-[2] items-center justify-center rounded-xl bg-primary text-[15px] font-bold text-onprimary">
            네이버 지도로 길찾기
          </a>
          <a href={kakaoDirections(s)} target="_blank" rel="noopener" className="flex h-[52px] flex-1 items-center justify-center rounded-xl border border-chipline bg-surface text-[14px] font-bold">
            카카오맵
          </a>
        </div>
        <p className="-mt-1.5 text-[12px] text-ink3 md:hidden">앱이 깔려 있으면 앱으로, 없으면 웹으로 열려요.</p>

        {pending && !gone && <VerifyBar id={s.id} by={s.by} yes={s.verify?.yes ?? 0} no={s.verify?.no ?? 0} />}

        {/* 소개글: 가게당 한 편, 누구나 고치고 이력에 남는다 */}
        <section className={SECTION}>
          <h2 className="text-[16px] font-bold">소개글</h2>
          {s.memo ? (
            <>
              <p className="text-[14px] leading-relaxed whitespace-pre-line">{s.memo}</p>
              <p className="text-[12px] text-ink3">
                {s.introBy && `처음 쓴 사람 ${s.introBy} · `}
                {s.introAt && `${confirmedAgo(s.introAt, now)} 고침 · `}
                <Link href={`/store/${s.id}/history`} className="underline underline-offset-2">
                  이력
                </Link>
                {" · "}
                <Link href={`/store/${s.id}/edit#intro`} className="underline underline-offset-2">
                  고치기
                </Link>
              </p>
            </>
          ) : (
            <Link href={`/store/${s.id}/edit#intro`} className="grid h-11 place-items-center rounded-xl border border-dashed border-chipline text-[14px] text-ink2">
              이 집 소개글 쓰기
            </Link>
          )}
        </section>

        {/* 사진 */}
        <section className={SECTION}>
          <h2 className="text-[16px] font-bold">사진</h2>
          {s.photos?.length ? (
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none]">
              {s.photos.map((p) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={p} src={`/api/photos/${p}`} alt={`${s.name} 사진`} className="h-32 w-40 shrink-0 rounded-xl border border-line object-cover" />
              ))}
              <AddPhoto id={s.id} />
            </div>
          ) : (
            <AddPhoto id={s.id} large />
          )}
        </section>

        <section className={SECTION}>
          <h2 className="flex items-baseline justify-between text-[16px] font-bold">
            메뉴판 <span className="text-[12px] font-normal text-ink3">가격 확인 {confirmedAgo(s.priceCheckedAt, now)}</span>
          </h2>
          <ul className="flex flex-col gap-1.5">
            {s.menu.map((m) => (
              <li key={m.name} className="flex justify-between gap-3 text-[14px]">
                <span>{m.name}</span>
                <b>{won(m.price)}</b>
              </li>
            ))}
          </ul>
        </section>

        <section className={SECTION}>
          <h2 className="text-[16px] font-bold">가게 정보</h2>
          <dl className="flex flex-col gap-2">
            <Row label="영업시간">
              {s.hours ? (
                hoursText(s.hours)
              ) : (
                <Link href={`/store/${s.id}/edit`} className="text-ink2 underline underline-offset-2">
                  + 영업시간 채우기
                </Link>
              )}
            </Row>
            {s.usage.length > 0 && <Row label="이용">{s.usage.map((u) => USAGES[u]).join(" · ")}</Row>}
            {s.sides.length > 0 && <Row label="같이 먹기">{s.sides.map((x) => SIDES[x]).join(" · ")}</Row>}
            {s.taste.length > 0 && <Row label="맛 결">{s.taste.map((t) => TASTES[t]).join(" · ")}</Row>}
          </dl>
        </section>

        {/* 평가: 별 + 한 줄 후기. 맵기 투표는 메뉴별 구조와 함께 나중에 (ADR-W06) */}
        <section className={SECTION}>
          <h2 className="text-[16px] font-bold">가 본 사람들의 평가</h2>
          <Stars rating={s.rating} size={14} />
          <ReviewForm id={s.id} />
          {written.length > 0 && (
            <ul className="mt-1 divide-y divide-line">
              {written.map((r) => (
                <li key={r.id} className="py-2.5">
                  <p className="flex flex-wrap items-center gap-x-1.5 text-[12px] text-ink3">
                    <b className="font-semibold text-ink2">{r.who}</b>
                    {r.stars && <span className="text-[#D98E04]">★{r.stars}</span>}
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

        <section className="flex items-center justify-between gap-3 border-t border-line pt-3.5">
          <div>
            <p className="text-[13px] text-ink3">마지막 확인</p>
            <p className="text-[15px] font-bold">{confirmedAgo(s.lastConfirmedAt, now)}</p>
          </div>
          <StillHere id={s.id} lat={s.lat} lng={s.lng} />
        </section>

        <MoreActions id={s.id} name={s.name} />
      </div>
    </div>
  );
}
