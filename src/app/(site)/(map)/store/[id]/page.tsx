import { MapPin } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import AddToList from "@/components/lists/AddToList";
import FlipStamp from "@/components/store/FlipStamp";
import SaveButton from "@/components/store/SaveButton";
import { AddPhoto, CopyAddress, FlagReviewButton, GoLinks, MoreActions, ReviewForm, StillHere, VerifyBar } from "@/components/store/StoreActions";
import { CloseStore, ShareButton, StoreDistance, StoreMiniMap } from "@/components/store/StoreLocation";
import { PendingTag, SampleRibbon, Stars, Tag } from "@/components/brand";
import { getRegion, getReviews, getStore, getStores } from "@/lib/data";
import { kakaoDirections, naverDirections } from "@/lib/directions";
import { won } from "@/lib/filters";
import { confirmedAgo, freshness, hoursText, todayHoursText } from "@/lib/freshness";
import { GRADES, RICE_CAKES, SHOP_TYPES, SIDES, SPICE_LEVELS, STALE_DAYS, STYLES, TASTES, USAGES } from "@/lib/taxonomy";
import { cn } from "@/lib/utils";
import { isPending, updateReasons } from "@/lib/wiki";

export async function generateStaticParams() {
  const ids = (await getStores()).map((s) => ({ id: s.id }));
  // Cache Components 는 빈 목록을 받지 않는다. 예시를 숨기고(NEXT_PUBLIC_SAMPLE_DATA=off) 빌드하면 빌드 때 가게가 0곳이라 자리 하나를 둔다 (요청 때는 없는 가게 = 404)
  return ids.length ? ids : [{ id: "none" }];
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

// 「가게 정보」 한 줄: 왼쪽 이름표 64px + 오른쪽 값(길면 줄 바꿈)
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <dt className="w-16 shrink-0 text-[14px] text-muted-foreground/70">{label}</dt>
      <dd className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5 text-[14px] break-keep [overflow-wrap:anywhere]">{children}</dd>
    </div>
  );
}

// 칸 사이 줄 (N-05 의 「가게 정보」와 같은 모양)
const SECTION = "flex flex-col gap-2 border-t border-border pt-3.5";
// 칸 제목
const H2 = "text-[16px] font-bold";
// 뒤로·♡·공유가 들어가는 머리칸. 폰에서는 위에 붙어 따라온다
const HEAD = "sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background px-1.5";

function Head({ name, right }: { name?: string; right?: React.ReactNode }) {
  return (
    <header className={cn(HEAD)}>
      <CloseStore />
      <p className="text-[16px] font-bold">{name ? "가게 정보" : ""}</p>
      <div className="flex min-w-11 justify-end">{right}</div>
    </header>
  );
}

// 가게 상세 · 위치 · 길찾기 (보드 N-05 + WB-01, 웹 1차 기획 M-W-02)
// 순서: 이름·종류·맵기 도장 → 동·거리·영업 → 대표 가격 → 위치 지도 → 주소 → 길찾기 → 소개글 → 사진 → 메뉴판 → 가게 정보 → 평가 → 마지막 확인 → 함께 고치기(빠진 정보 + 고치기 넷).
// PC는 옆 큰 지도가 작은 지도를 대신한다.
export default function StorePage({ params }: PageProps<"/store/[id]">) {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-card md:min-h-full">
          <Head />
        </div>
      }
    >
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
  const why = gone || pending ? [] : updateReasons(s, now);

  return (
    <div className="min-h-dvh bg-card pb-10 md:min-h-full">
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
          <p className="rounded-xl bg-spicybg px-3 py-2 text-[13px] text-spicytext break-keep">
            {s.status === "closed" ? "문을 닫았다는 신고가 쌓여 지도에서 내렸어요." : "사실과 다르다는 의견이 쌓여 지도에서 내렸어요."}
          </p>
        )}
        {!gone && fresh !== "fresh" && (
          <p className="rounded-xl bg-secondary px-3 py-2 text-[13px] text-muted-foreground break-keep">오래된 정보일 수 있어요. 마지막 확인이 {STALE_DAYS}일을 넘었어요.</p>
        )}

        {/* 머리: 도장(누르면 표정) + 이름 + 종류. 11-08 사진으로 바꿔 봤다가 사용자 「도장 위치가 제일 낫다」로 되돌림 (보드 WB-06) */}
        <div className="flex items-center gap-3">
          <FlipStamp n={s.spice} size={44} faded={fresh !== "fresh"} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
              <h1 className="text-[21px] font-bold leading-tight break-keep [overflow-wrap:anywhere]">{s.name}</h1>
              <span className="inline-flex h-6 items-center rounded-full bg-muted px-2.5 text-[12px] font-medium whitespace-nowrap text-muted-foreground">
                {GRADES[s.grade]}
                {s.shopType && ` · ${SHOP_TYPES[s.shopType]}`}
              </span>
              {pending && <PendingTag />}
            </div>
            <p className="mt-0.5 text-[13px] text-muted-foreground/70">
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
            <span className="min-w-0 text-[14px] text-muted-foreground">{s.menu[0].name}</span>
            <b className="shrink-0 text-[19px]">{won(s.price)}</b>
          </p>
          <p className="mt-0.5 text-[12.5px] text-muted-foreground/70 break-keep">
            맵기 {s.spice} · {SPICE_LEVELS[s.spice].ref} · 대표 메뉴 기준 · {confirmedAgo(s.priceCheckedAt, now)} 확인
            {s.spiceLabel && ` · 가게 단계 「${s.spiceLabel}」`}
          </p>
        </div>

        <StoreMiniMap store={s} />

        {/* 주소 · 길찾기 */}
        <div className="flex items-center gap-2">
          <MapPin size={18} strokeWidth={2} className="shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="min-w-0 flex-1 text-[14px] break-keep [overflow-wrap:anywhere]">{s.address}</span>
          <CopyAddress address={s.address} />
        </div>
        <GoLinks id={s.id} naver={naverDirections(s)} kakao={kakaoDirections(s)} />
        <p className="-mt-1.5 text-[12px] text-muted-foreground/70 md:hidden">앱이 깔려 있으면 앱으로, 없으면 웹으로 열려요.</p>

        {/* 내 맛지도 리스트에 담기 (11-08) */}
        {!gone && <AddToList storeId={s.id} />}

        {pending && !gone && <VerifyBar id={s.id} by={s.by} yes={s.verify?.yes ?? 0} no={s.verify?.no ?? 0} />}

        {/* 소개글: 가게당 한 편, 누구나 고치고 이력에 남는다 */}
        <section className={cn(SECTION)}>
          <h2 className={cn(H2)}>소개글</h2>
          {s.memo ? (
            <>
              <p className="text-[14px] leading-relaxed whitespace-pre-line break-keep [overflow-wrap:anywhere]">{s.memo}</p>
              <p className="text-[12px] text-muted-foreground/70">
                {s.introBy && `처음 쓴 사람 ${s.introBy} · `}
                {s.introAt && `${confirmedAgo(s.introAt, now)} 고침 · `}
                <Link href={`/store/${s.id}/history`} className="hit underline underline-offset-2">
                  이력
                </Link>
                {" · "}
                <Link href={`/store/${s.id}/edit#intro`} className="hit underline underline-offset-2">
                  고치기
                </Link>
              </p>
            </>
          ) : (
            <Link href={`/store/${s.id}/edit#intro`} className="grid h-11 place-items-center rounded-xl border border-dashed border-input text-[14px] text-muted-foreground hover:bg-muted">
              이 집 소개글 쓰기
            </Link>
          )}
        </section>

        {/* 사진 */}
        <section id="store-photos" className={cn(SECTION, "scroll-mt-16")}>
          <h2 className={cn(H2)}>사진</h2>
          {s.photos?.length ? (
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none]">
              {s.photos.map((p) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={p} src={`/api/photos/${p}`} alt={`${s.name} 사진`} className="h-32 w-40 shrink-0 rounded-xl border border-border object-cover" />
              ))}
              <AddPhoto id={s.id} />
            </div>
          ) : (
            <AddPhoto id={s.id} large />
          )}
        </section>

        <section className={cn(SECTION)}>
          <h2 className={cn(H2, "flex items-baseline justify-between")}>
            메뉴판 <span className="text-[12px] font-normal text-muted-foreground/70">가격 확인 {confirmedAgo(s.priceCheckedAt, now)}</span>
          </h2>
          <ul className="flex flex-col gap-1.5">
            {s.menu.map((m) => (
              <li key={m.name} className="flex justify-between gap-3 text-[14px]">
                <span className="min-w-0 break-keep [overflow-wrap:anywhere]">{m.name}</span>
                <b className="shrink-0">{won(m.price)}</b>
              </li>
            ))}
          </ul>
        </section>

        <section className={cn(SECTION)}>
          <h2 className={cn(H2)}>가게 정보</h2>
          <dl className="flex flex-col gap-2">
            <Row label="영업시간">
              {s.hours ? (
                hoursText(s.hours)
              ) : (
                <Link href={`/store/${s.id}/edit`} className="text-muted-foreground underline underline-offset-2">
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
        <section className={cn(SECTION)}>
          <h2 className={cn(H2)}>가 본 사람들의 평가</h2>
          <Stars rating={s.rating} size={14} />
          <ReviewForm id={s.id} />
          {written.length > 0 && (
            <ul className="mt-1 divide-y divide-border">
              {written.map((r) => (
                <li key={r.id} className="py-2.5">
                  <p className="flex flex-wrap items-center gap-x-1.5 text-[12px] text-muted-foreground/70">
                    <b className="font-semibold text-muted-foreground">{r.who}</b>
                    {/* 별 색은 brand/Stars 와 같은 값 */}
                    {r.stars && <span className="text-[#D98E04]">★{r.stars}</span>}
                    <span>· {confirmedAgo(r.at.slice(0, 10), now)}</span>
                    <span className="ml-auto">
                      <FlagReviewButton storeId={s.id} reviewId={r.id} />
                    </span>
                  </p>
                  <p className="mt-1 text-[14px] break-keep [overflow-wrap:anywhere]">{r.text}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="flex items-center justify-between gap-3 border-t border-border pt-3.5">
          <div>
            <p className="text-[13px] text-muted-foreground/70">마지막 확인</p>
            <p className="text-[15px] font-bold">{confirmedAgo(s.lastConfirmedAt, now)}</p>
          </div>
          <StillHere id={s.id} lat={s.lat} lng={s.lng} />
        </section>

        {/* 함께 고치기 (11-08 메뉴에서 이곳으로 옮김): 이 가게에 빠졌거나 오래된 정보 + 고치기 넷 */}
        <section className={cn(SECTION)}>
          <h2 className={cn(H2, "flex items-baseline justify-between")}>
            함께 고치기 <span className="text-[12px] font-normal text-muted-foreground/70">가입 없이 누구나</span>
          </h2>
          {why.length > 0 ? (
            <>
              <p className="text-[13px] text-muted-foreground break-keep">빠졌거나 오래된 정보가 있어요. 아시는 만큼만 채워 주세요.</p>
              <p className="flex flex-wrap gap-1">
                {why.map((w) => (
                  <span key={w} className="rounded-full bg-secondary px-2 text-[12px] leading-6 text-muted-foreground">
                    {w}
                  </span>
                ))}
              </p>
            </>
          ) : (
            <p className="text-[13px] text-muted-foreground break-keep">달라진 게 보이면 고쳐 주세요. 고친 내용은 변경 이력에 남아요.</p>
          )}
          <MoreActions id={s.id} name={s.name} />
        </section>
      </div>
    </div>
  );
}
