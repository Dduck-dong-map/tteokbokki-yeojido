import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { GRADES, RICE_CAKES, STYLES, USAGES, keysOf } from "@/lib/taxonomy";
import { Choice, HoursField, IntroField, MapPicker, MenuEditor, NickField, PhotoPicker, SpiceInput } from "./fields";
import type { EditFormViewProps } from "./types";

// 정보 고치기 (웹 1차 기획 M-W-04): 지금 가게 정보 + 소개글 칸 + 맵기 칸. 누구나 고칠 수 있고 바로 반영되며 변경 이력에 남는다.
// 자주 바뀌는 것(메뉴·가격)부터 위에 둔다. 폰·PC 모두 한 줄(세로)이고 컨테이너의 틀이 폭을 정한다.
// 그리기만 한다. 값은 values, 바꿈은 onChange(patch). checkPatch·fetch·router·#intro 해시 처리는 컨테이너(EditForm.tsx)가 한다.
export default function EditFormView({ store, stores, values, moveOpen, error, sending, onChange, onOpenMove, onSubmit }: EditFormViewProps) {
  return (
    <div className="flex flex-col gap-6 px-5 pt-4 pb-[calc(env(safe-area-inset-bottom)+20px)] md:px-0">
      <p className="rounded-xl bg-secondary px-3 py-2 text-body-small leading-relaxed text-muted-foreground">
        고치면 바로 반영되고{" "}
        <Link href={`/store/${store.id}/history`} className="hit font-semibold underline underline-offset-2">
          변경 이력
        </Link>
        에 남아요.
      </p>

      <Section title="메뉴와 가격" sub="가장 자주 바뀌어요">
        <MenuEditor menu={values.menu} onChange={(menu) => onChange({ menu })} />
      </Section>

      {/* 상세의 「이 집 소개글 쓰기」가 #intro 로 온다. 스크롤·포커스는 컨테이너가 한다 */}
      <Section id="intro" title="소개글" sub="가게당 한 편 · 선택">
        <IntroField id="edit-intro" value={values.memo} onChange={(memo) => onChange({ memo })} />
      </Section>

      <Section title="영업시간">
        <HoursField value={values.hours} onChange={(hours) => onChange({ hours })} />
      </Section>

      <Section title="사진 더하기">
        <PhotoPicker ids={values.photos} onChange={(photos) => onChange({ photos })} hint="간판·메뉴판·떡볶이 사진 환영해요" />
      </Section>

      <Section title="맵기" sub="대표 메뉴 기준 · 신라면 = 3">
        <SpiceInput value={values.spice} onChange={(spice) => onChange({ spice })} />
      </Section>

      <Section title="떡과 스타일">
        <div className="flex flex-wrap gap-2">
          {keysOf(RICE_CAKES).map((k) => (
            <Choice key={k} on={values.rice.includes(k)} onClick={() => onChange({ rice: values.rice.includes(k) ? values.rice.filter((x) => x !== k) : [...values.rice, k] })}>
              {RICE_CAKES[k]}
            </Choice>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {keysOf(STYLES).map((k) => (
            <Choice key={k} on={values.style === k} onClick={() => onChange({ style: k })}>
              {STYLES[k]}
            </Choice>
          ))}
        </div>
      </Section>

      <Section title="이용">
        <div className="flex flex-wrap gap-2">
          {keysOf(USAGES).map((k) => (
            <Choice key={k} on={values.usage.includes(k)} onClick={() => onChange({ usage: values.usage.includes(k) ? values.usage.filter((x) => x !== k) : [...values.usage, k] })}>
              {USAGES[k]}
            </Choice>
          ))}
        </div>
      </Section>

      <Section title="가게 기본 정보">
        <div className="flex flex-col gap-3">
          <TextField label="가게 이름" value={values.name} onChange={(e) => onChange({ name: e.target.value })} maxLength={60} />
          <TextField label="주소" value={values.address} onChange={(e) => onChange({ address: e.target.value })} maxLength={120} />
          <div className="flex flex-wrap gap-2">
            {keysOf(GRADES).map((k) => (
              <Choice key={k} on={values.grade === k} onClick={() => onChange({ grade: k })}>
                {GRADES[k]}
              </Choice>
            ))}
          </div>
          {/* 위치는 일부러 접어 둔다. 열면 원래 자리에서 시작하고, 옮긴 좌표는 열려 있을 때만 보낸다 */}
          {moveOpen ? (
            <MapPicker stores={stores} start={store} onChange={(pos) => onChange({ pos })} />
          ) : (
            <Button type="button" variant="outline" onClick={onOpenMove} className="h-11 rounded-xl border-dashed border-input bg-transparent text-caption font-normal text-muted-foreground">
              지도 위치도 고치기
            </Button>
          )}
        </div>
      </Section>

      <NickField />

      {error && (
        <p role="alert" className="text-body-small text-spicytext">
          {error}
        </p>
      )}
      <Button type="button" variant="filled" size="xl" onClick={onSubmit} disabled={sending}>
        {sending ? "저장하는 중…" : "고친 내용 올리기"}
      </Button>
    </div>
  );
}

// 칸 하나: 제목 + 작은 보조말. id 가 있으면 해시(#intro)로 바로 올 수 있게 scroll-mt 를 둔다
function Section({ id, title, sub, children }: { id?: string; title: string; sub?: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-16 md:scroll-mt-20">
      {/* 제목은 조선100년체라 굵기를 주지 않는다. 보조말은 14px 이라 본문 글꼴로 */}
      <h2 className="mb-2 text-body-medium">
        {title} {sub && <span className="font-sans text-caption font-normal text-muted-foreground/70">{sub}</span>}
      </h2>
      {children}
    </section>
  );
}
