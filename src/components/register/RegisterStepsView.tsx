import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { GRADES, RICE_CAKES, STYLES, keysOf, type RiceCake } from "@/lib/taxonomy";
import { cn } from "@/lib/utils";
import { MIN_PHOTOS, VERIFY_DAYS } from "@/lib/wiki";
import { Choice, HoursField, IntroField, MapPicker, MenuEditor, NickField, PhotoPicker, SpiceInput, StarInput } from "./fields";
import type { RegisterFormViewProps } from "./types";

// 맛집 등록 다섯 단계의 입력칸 (웹 1차 기획 M-W-03 1~5). RegisterFormView 의 격자 안에 들어가는 두 칼럼을 그린다.
// 왼쪽 칼럼 = 1~4단계(가게·위치 / 떡·맛 / 메뉴·가격 / 소개글), 오른쪽 칼럼 = 지도 + 5단계(사진·닉네임·PC 올리기).
// 폰(<768)은 지금 step 과 다른 섹션을 숨긴다. 칸은 하나만 만들어 CSS 로 나눈다.
// 그리기만 한다. 값은 draft, 바꿈은 onChange(patch) 로 컨테이너에 올린다.
type Props = Pick<RegisterFormViewProps, "step" | "draft" | "stores" | "mapKey" | "mapGoTo" | "mapHint" | "sending" | "onChange" | "onPosition" | "onSubmit"> & {
  message: ReactNode; // 오류·중복 안내 블록 (PC 「지도에 올리기」 위에 둔다)
};

// 제목(h2 · h3)은 조선100년체라 굵기를 주지 않는다. 제목 옆 작은 보조말은 14px 이라 본문 글꼴(font-sans)로 돌린다
const TITLE = "text-body-large";
const SUBTITLE = "mb-2 text-body-medium";
const HINT = "font-sans text-caption font-normal text-muted-foreground/70";
const LABEL = "text-body-small text-muted-foreground/70";

export default function RegisterStepsView({ step, draft, stores, mapKey, mapGoTo, mapHint, sending, onChange, onPosition, onSubmit, message }: Props) {
  // 폰에서는 지금 단계만 보인다
  const only = (i: number) => (step === i ? "" : "max-md:hidden");

  return (
    <>
      {/* 입력 */}
      <div className="flex flex-col gap-8 md:min-w-0">
        <section id="reg-0" className={cn("flex scroll-mt-20 flex-col gap-4", only(0))}>
          <h2 className={TITLE}>어떤 가게인가요?</h2>
          <TextField id="reg-name" label="가게 이름" value={draft.name} onChange={(e) => onChange({ name: e.target.value })} maxLength={60} placeholder="간판 그대로 적어 주세요" />
          <div id="reg-grade">
            <p className={cn("mb-1.5", LABEL)}>떡볶이를 어떻게 파나요?</p>
            <div className="flex flex-wrap gap-2">
              {keysOf(GRADES).map((k) => (
                <Choice key={k} on={draft.grade === k} onClick={() => onChange({ grade: k })}>
                  {GRADES[k]}
                </Choice>
              ))}
            </div>
          </div>
          <TextField id="reg-address" label="주소" value={draft.address} onChange={(e) => onChange({ address: e.target.value })} maxLength={120} placeholder="예: 서울 마포구 망원동 123" />
        </section>

        <section id="reg-1" className={cn("flex scroll-mt-20 flex-col gap-5", only(1))}>
          <h2 className={cn(TITLE, "max-md:hidden")}>떡과 맛</h2>
          <div id="reg-rice">
            <h3 className={SUBTITLE}>
              떡 <span className={HINT}>여러 개</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {keysOf(RICE_CAKES).map((k: RiceCake) => (
                <Choice key={k} on={draft.rice.includes(k)} onClick={() => onChange({ rice: draft.rice.includes(k) ? draft.rice.filter((x) => x !== k) : [...draft.rice, k] })}>
                  {RICE_CAKES[k]}
                </Choice>
              ))}
            </div>
          </div>
          <div id="reg-style">
            <h3 className={SUBTITLE}>
              스타일 <span className={HINT}>하나</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {keysOf(STYLES).map((k) => (
                <Choice key={k} on={draft.style === k} onClick={() => onChange({ style: k })}>
                  {STYLES[k]}
                </Choice>
              ))}
            </div>
          </div>
          <div id="reg-spice">
            <h3 className={SUBTITLE}>
              맵기 <span className={HINT}>대표 메뉴 기준 · 신라면 = 3</span>
            </h3>
            <SpiceInput value={draft.spice} onChange={(spice) => onChange({ spice })} />
          </div>
          <div>
            <h3 className={SUBTITLE}>
              가게는 어땠어요? <span className={HINT}>선택</span>
            </h3>
            <StarInput value={draft.stars} onChange={(stars) => onChange({ stars })} />
          </div>
        </section>

        <section id="reg-2" className={cn("flex scroll-mt-20 flex-col gap-4", only(2))}>
          <div>
            <h2 className={TITLE}>메뉴와 가격</h2>
            <p className={cn("mt-1", LABEL)}>대표 메뉴 하나면 충분해요. 나머지는 나중에 누구나 더할 수 있어요.</p>
          </div>
          <div id="reg-menu">
            <MenuEditor menu={draft.menu} onChange={(menu) => onChange({ menu })} />
          </div>
          <div>
            <h3 className={SUBTITLE}>
              영업시간 <span className={HINT}>선택</span>
            </h3>
            <HoursField value={draft.hours ?? null} onChange={(hours) => onChange({ hours: hours ?? undefined })} />
          </div>
        </section>

        <section id="reg-3" className={cn("flex scroll-mt-20 flex-col gap-3", only(3))}>
          <h2 className={TITLE}>
            이 집을 소개해 주세요 <span className={HINT}>선택</span>
          </h2>
          <IntroField id="reg-intro" value={draft.memo ?? ""} onChange={(memo) => onChange({ memo })} />
        </section>
      </div>

      {/* 지도 · 사진 · 올리기. 폰에서는 지도가 1단계, 사진이 5단계에 나온다 */}
      <div className="flex flex-col gap-6 md:min-w-0">
        <div className={only(0)}>
          <p className={cn("mb-1.5", LABEL)}>가게 위치</p>
          {/* mapKey 가 바뀌면(이어서 쓰기) 저장된 좌표에서 다시 그린다 */}
          <MapPicker key={mapKey} stores={stores} start={mapKey && draft.lat !== undefined && draft.lng !== undefined ? { lat: draft.lat, lng: draft.lng } : undefined} onChange={onPosition} goTo={mapGoTo} hint={mapHint} tall />
        </div>
        <section id="reg-4" className={cn("flex scroll-mt-20 flex-col gap-5", only(4))}>
          <div id="reg-photos">
            <h2 className={TITLE}>{MIN_PHOTOS > 0 ? "사진을 올려 주세요" : "사진이 있으면 올려 주세요"}</h2>
            <p className={cn("mt-1 mb-3", LABEL)}>{MIN_PHOTOS > 0 ? `간판이나 메뉴판 ${MIN_PHOTOS}장 이상` : "없어도 올릴 수 있어요 · 간판이나 메뉴판"} · 진짜 있는 가게인지 확인하는 데 써요</p>
            <PhotoPicker ids={draft.photos} onChange={(photos) => onChange({ photos })} hint="사람 얼굴이 크게 나오지 않게 찍어 주세요. 찍은 위치 정보는 지워서 올려요." />
          </div>
          <NickField />
          <p className="rounded-xl bg-secondary px-3 py-2 text-body-small break-keep text-muted-foreground [overflow-wrap:anywhere]">
            올리면 바로 지도에 나오고, {VERIFY_DAYS}일 동안 「확인 중」으로 보여요. 사실과 다르면 다른 사람이 고치거나 신고할 수 있어요.
          </p>
          {/* 768 이상: 올리기 단추는 여기. 폰은 RegisterFormView 의 아래 고정 줄이 맡는다 */}
          <div className="max-md:hidden">
            {message}
            <Button type="button" variant="filled" size="xl" onClick={() => onSubmit()} disabled={sending} className="w-full">
              {sending ? "올리는 중…" : "지도에 올리기"}
            </Button>
          </div>
        </section>
      </div>
    </>
  );
}
