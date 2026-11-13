import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { VERIFY_YES } from "@/lib/wiki";
import RegisterStepsView from "./RegisterStepsView";
import type { RegisterFormViewProps } from "./types";

// 맛집 등록 + 소개글 (보드 WB-02 · 웹 1차 기획 M-W-03). 보내면 승인 없이 바로 지도에 올라간다.
// 폰은 다섯 단계를 한 칸씩 넘기고(위 진행 막대 · 아래 고정 단추), 768 이상은 같은 칸들을 한 화면에 잇는다(오른쪽에 지도·사진), 1024 이상은 왼쪽에 진행 표시.
// 그리기만 한다. 단계·입력값·오류·임시 저장 유무는 컨테이너(RegisterForm.tsx)가 props 로 넘기고,
// 키보드 높이(--kb)·칸으로 스크롤·포커스 이동·localStorage 도 컨테이너 몫이다.
export default function RegisterFormView(props: RegisterFormViewProps) {
  const { step, steps, draft, done, touched, hasSavedDraft, draftClosed, error, dupId, doneId, sending, onNext, onPrev, onSubmit, onResumeDraft, onDiscardDraft } = props;

  // 올린 뒤 완료 화면 (M-W-03-01)
  if (doneId)
    return (
      <div className="mx-auto max-w-[480px] px-6 py-16 text-center">
        <p className="text-[40px]" aria-hidden="true">
          🍢
        </p>
        <h2 className="mt-3 text-[20px] font-bold">지도에 올렸어요. 서비스 어묵 하나 드려요</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
          일주일 동안 「확인 중」으로 보여요.
          <br />가 본 사람 {VERIFY_YES}명이 「맞아요」를 누르면 확인이 끝나요.
        </p>
        <Link href={`/store/${doneId}`} className={cn(buttonVariants(), "mt-8 h-12 w-full rounded-xl text-[16px] font-bold")}>
          올린 가게 보기
        </Link>
        <Link href="/" className={cn(buttonVariants({ variant: "outline" }), "mt-2 h-11 w-full rounded-xl border-input bg-card text-[14px] font-normal text-muted-foreground")}>
          지도로 돌아가기
        </Link>
      </div>
    );

  // 오류·중복 안내 (경고창#1·#2). PC 는 올리기 단추 위, 폰은 아래 고정 줄 위에 나온다
  const message = error && (
    <div role="alert" className="mb-2 text-[13px] text-spicytext">
      <p>{error}</p>
      {dupId && (
        <div className="mt-2 flex gap-2">
          <Link href={`/store/${dupId}`} className={cn(buttonVariants({ variant: "outline" }), "h-11 flex-1 rounded-xl border-muted-foreground bg-card text-[14px] font-bold text-foreground md:h-10")}>
            그 가게 보기
          </Link>
          <Button type="button" variant="outline" onClick={() => onSubmit(true)} disabled={sending} className="h-11 flex-1 rounded-xl border-input bg-card text-[14px] font-normal text-muted-foreground md:h-10">
            다른 가게예요
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex min-h-[calc(100dvh-48px)] flex-col px-5 pt-4 md:block md:min-h-0 md:px-0 md:pt-0">
      {/* 쓰다 만 등록 (기기 안 임시 저장). 칸을 건드리거나 띠를 닫으면 사라진다 */}
      {hasSavedDraft && !touched && !draftClosed && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl bg-secondary px-3 py-2.5 text-[13px] text-muted-foreground">
          <span className="min-w-0 flex-1">쓰다 만 등록이 있어요.</span>
          <Button type="button" onClick={onResumeDraft} className="h-11 rounded-lg px-3 text-[13px] font-bold md:h-9">
            이어서 쓰기
          </Button>
          <Button type="button" variant="outline" onClick={onDiscardDraft} className="h-11 rounded-lg border-input bg-card px-3 text-[13px] font-normal text-foreground md:h-9">
            새로 쓰기
          </Button>
        </div>
      )}

      {/* 폰: 위 진행 막대 */}
      <ol className="flex gap-1 md:hidden" aria-label={`${steps.length}단계 중 ${step + 1}단계`}>
        {steps.map((s, i) => (
          <li key={s} className="flex-1">
            <span className={cn("block h-1 rounded-full", i <= step ? "bg-primary" : "bg-border")} />
            <span className={cn("mt-1 block text-[11px] leading-tight", i === step ? "font-bold text-foreground" : "text-muted-foreground/70")}>{s}</span>
          </li>
        ))}
      </ol>

      <div className="mt-6 flex flex-1 flex-col gap-4 md:mt-0 md:grid md:grid-cols-2 md:gap-6 lg:grid-cols-[150px_minmax(0,1fr)_minmax(0,1fr)] lg:gap-7">
        {/* 1024 이상: 왼쪽 진행 표시. 누르면 그 칸으로, 채운 칸은 ✓
            1280 이상: 제목 아래 화면 왼쪽 끝에 붙인다 (사용자 11-08 시안 Group 3616). 칸 자리는 그대로 두고 옆으로만 옮겨 입력 칸이 움직이지 않게 한다 */}
        <nav
          aria-label="등록 칸"
          className="hidden self-start lg:sticky lg:top-[72px] lg:flex lg:flex-col lg:gap-2.5 lg:text-[14px] xl:mt-5 xl:translate-x-[calc(56px_-_(100vw_-_1168px)/2_-_24px)]"
        >
          {steps.map((s, i) => (
            <a key={s} href={`#reg-${i}`} className={cn(i === done.indexOf(false) ? "font-bold text-foreground" : "text-muted-foreground/70")}>
              {i + 1}. {s} {done[i] && "✓"}
            </a>
          ))}
        </nav>

        <RegisterStepsView
          step={step}
          draft={draft}
          stores={props.stores}
          mapKey={props.mapKey}
          sending={sending}
          onChange={props.onChange}
          onPosition={props.onPosition}
          onSubmit={onSubmit}
          message={message}
        />
      </div>

      {/* 폰: 아래에 붙는 단추. 입력 중에도 보인다. --kb(키보드 높이)는 컨테이너가 바깥 요소에 넣는다 */}
      <div className="sticky bottom-[var(--kb,0px)] z-10 -mx-5 mt-4 bg-background px-5 pt-2 pb-[calc(env(safe-area-inset-bottom)+12px)] md:hidden">
        {message}
        <div className="flex gap-2">
          {step > 0 && (
            <Button type="button" variant="outline" onClick={onPrev} className="h-12 flex-1 rounded-xl border-input bg-card text-[15px] font-normal text-muted-foreground">
              이전
            </Button>
          )}
          {step === 3 && !draft.memo?.trim() && (
            <Button type="button" variant="outline" onClick={onNext} className="h-12 flex-1 rounded-xl border-input bg-card text-[15px] font-normal text-muted-foreground">
              건너뛰기
            </Button>
          )}
          <Button type="button" onClick={onNext} disabled={sending} className="h-12 flex-[2] rounded-xl text-[16px] font-bold">
            {step < steps.length - 1 ? "다음" : sending ? "올리는 중…" : "지도에 올리기"}
          </Button>
        </div>
      </div>
    </div>
  );
}
