import Link from "next/link";
import { useId, type ReactNode } from "react";
import { SpiceStamp } from "@/components/brand";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { Spice } from "@/lib/taxonomy";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "./Icon";

// 어드민 화면 공통 조각 (11-19: 전용 CSS 「Admin Navy」를 걷어 내고 Tailwind · ui/ 부품 · 디자인 토큰으로 옮김).
// 색은 디자인 토큰 유틸만 쓴다. 디자인 시스템에 성공 · 경고 · 정보 색이 따로 없어 아래 TONE 처럼 있는 토큰에 잇고,
// 상태는 늘 글자 라벨과 함께 보인다 (디자인 시스템 접근성 2절: 색만으로 구분하지 않는다).
// 훅 · 이벤트가 필요한 조각(선택 칸 · 토스트 · 체크)은 controls.tsx 에 있다.

export type Tone = "neutral" | "success" | "warning" | "danger" | "info";

// 글 속 링크 (밑줄로 링크임을 알린다 — 색만으로 구분하지 않는다)
export const LINK = "text-link underline underline-offset-4 hover:text-foreground";

// 완료 = 옥빛 옅은 면, 확인 필요 = 제보 갈색, 위험 = 오류 빨강, 정보 = 테두리만, 중립 = 가라앉은 면
const TONE: Record<Tone, string> = {
  neutral: "bg-muted text-foreground",
  success: "bg-secondary text-secondary-foreground",
  warning: "bg-report/10 text-report",
  danger: "bg-destructive/10 text-destructive",
  info: "border-input bg-card text-foreground",
};
const NOTICE: Record<Tone, { box: string; icon: IconName }> = {
  neutral: { box: "border-l-input bg-muted", icon: "info" },
  info: { box: "border-l-input bg-muted", icon: "info" },
  success: { box: "border-l-primary bg-secondary", icon: "check" },
  warning: { box: "border-l-report bg-report/10", icon: "alert" },
  danger: { box: "border-l-destructive bg-destructive/10", icon: "alert" },
};

// 상태 표시. 글자 라벨을 꼭 넣는다
export function StatusBadge({ tone = "neutral", className, children }: { tone?: Tone; className?: string; children: ReactNode }) {
  return <Badge className={cn("h-6 rounded-badge px-2 text-caption font-medium", TONE[tone], className)}>{children}</Badge>;
}

// 화면 번호 · id 처럼 고정폭으로 보이는 작은 표시
export function IdBadge({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <Badge variant="outline" className={cn("h-6 rounded-badge border-input px-2 font-mono text-caption font-normal text-muted-foreground", className)}>
      {children}
    </Badge>
  );
}

// 안내 띠. danger 는 꼭 고쳐야 하는 오류라 role="alert". 저장 결과처럼 뒤늦게 나타나는 띠는 role="status" 를 준다
export function Notice({ tone = "info", role, className, children }: { tone?: Tone; role?: "status" | "alert"; className?: string; children: ReactNode }) {
  const n = NOTICE[tone];
  return (
    <div role={role ?? (tone === "danger" ? "alert" : undefined)} className={cn("mb-4 flex items-start gap-3 rounded-control border-l-4 px-4 py-3 text-body-small text-foreground", n.box, className)}>
      <Icon name={n.icon} className="mt-0.5 size-4" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

// 머리글: 제목 + 화면 번호 + 설명, 오른쪽에 단추(children). 단추·링크는 AdminOnly 로 감싸서 넘긴다
export function PageHeader({ title, desc, id, children }: { title: string; desc?: string; id: string; children?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-start gap-3 md:flex-nowrap md:gap-4">
      <div className="min-w-0">
        <h1 className="flex flex-wrap items-center gap-2 text-heading-3 text-foreground">
          {title} <IdBadge>{id}</IdBadge>
        </h1>
        {desc && <p className="mt-1 text-body-small text-muted-foreground">{desc}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2 md:ml-auto md:shrink-0">{children}</div>}
    </div>
  );
}

export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="위치" className="mb-3 flex flex-wrap items-center gap-1 text-body-small text-muted-foreground">
      {items.map((it, i) => (
        <span key={it.label} className="contents">
          {i > 0 && <span aria-hidden="true">/</span>}
          {it.href ? (
            <Link href={it.href} className="underline-offset-4 hover:text-link hover:underline">
              {it.label}
            </Link>
          ) : (
            <span aria-current="page" className="text-foreground">
              {it.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}

// 화면 안의 묶음: 제목(h2) + 내용. highlight 는 꼭 봐야 하는 묶음(오류 테두리)
export function Section({ id, title, extra, highlight, className, children }: { id?: string; title?: ReactNode; extra?: ReactNode; highlight?: boolean; className?: string; children: ReactNode }) {
  return (
    <section id={id} className={cn("mb-8 scroll-mt-4", highlight && "rounded-control border border-destructive p-4", className)}>
      {title && (
        <h2 className="mb-3 flex flex-wrap items-center gap-2 text-heading-4 text-foreground">
          {title}
          {extra}
        </h2>
      )}
      {children}
    </section>
  );
}

// 카드 면(ui/card): 제목 줄 · 내용 · 아래 줄. flush 는 안쪽 여백 없이(표 · 목록을 바로 넣을 때)
export function Panel({ title, actions, footer, flush, className, children }: { title?: ReactNode; actions?: ReactNode; footer?: ReactNode; flush?: boolean; className?: string; children: ReactNode }) {
  return (
    <Card className={cn("gap-0 rounded-lg py-0 text-body-small ring-border", className)}>
      {(title || actions) && (
        <CardHeader className="flex flex-wrap items-center gap-3 rounded-t-lg border-b border-border px-5 py-4">
          {title && (
            <CardTitle role="heading" aria-level={3} className="font-sans text-heading-4 font-normal text-foreground">
              {title}
            </CardTitle>
          )}
          {actions && <div className="ml-auto flex flex-wrap items-center gap-2">{actions}</div>}
        </CardHeader>
      )}
      <CardContent className={flush ? "p-0" : "p-5"}>{children}</CardContent>
      {footer && <CardFooter className="flex-wrap justify-end gap-2 rounded-b-lg border-t border-border bg-transparent px-5 py-4">{footer}</CardFooter>}
    </Card>
  );
}

// 표 틀: 도구 줄 · 표(ui/table) · 아래 줄을 한 면에 담는다. 칸 여백 · 머리 바탕 · 글자 크기를 여기서 한 번에 준다.
// compact 는 줄이 많은 표(여백을 줄인다). 칸은 줄을 바꾸지 않는 것이 기본이라(ui/table) 표가 넓으면 ui/table 의 틀이 옆으로 스크롤한다
// (페이지는 밀리지 않는다). 글이 긴 칸에만 CELL_WRAP 을 준다
const TABLE =
  "[&_th]:h-11 [&_th]:bg-muted [&_th]:px-4 [&_th]:text-body-small [&_th]:text-muted-foreground [&_td]:px-4 [&_td]:py-3 [&_td]:text-body-small [&_tr]:border-border [&_tbody_tr:hover]:bg-ghost-hover";
const TABLE_COMPACT = "[&_th]:h-9 [&_th]:px-3 [&_td]:px-3 [&_td]:py-2";

export function TableFrame({ toolbar, footer, compact, className, children }: { toolbar?: ReactNode; footer?: ReactNode; compact?: boolean; className?: string; children: ReactNode }) {
  return (
    <div className={cn("overflow-hidden rounded-lg border border-border bg-card", TABLE, compact && TABLE_COMPACT, className)}>
      {toolbar && <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3 print:hidden">{toolbar}</div>}
      {children}
      {footer && <div className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-3 text-body-small text-muted-foreground print:hidden">{footer}</div>}
    </div>
  );
}

// 표의 숫자 칸 · 가장 중요한 칸에 붙이는 클래스 (TableHead · TableCell 의 className)
export const CELL_NUM = "text-right tabular-nums";
export const CELL_MAIN = "font-medium text-foreground";
export const CELL_WRAP = "min-w-56 whitespace-normal";

// 이름 – 값 목록
export function KeyValue({ items, className }: { items: [ReactNode, ReactNode][]; className?: string }) {
  return (
    <dl className={cn("grid grid-cols-[6rem_1fr] gap-x-3 gap-y-2", className)}>
      {items.map(([k, v], i) => (
        <div key={i} className="contents">
          <dt className="text-body-small text-muted-foreground">{k}</dt>
          <dd className="min-w-0 text-body-small text-foreground">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

// 빈 화면 · 불러오는 중 · 잠김 안내
export function Empty({ icon, title, desc, children }: { icon?: IconName; title?: ReactNode; desc?: ReactNode; children?: ReactNode }) {
  return (
    <div className="px-6 py-12 text-center text-muted-foreground">
      {icon && <Icon name={icon} className="mx-auto mb-4 size-12" />}
      {title && <div className="text-body-medium font-medium text-foreground">{title}</div>}
      {desc && <div className="mt-1 text-body-small">{desc}</div>}
      {children && <div className="mt-4 flex justify-center">{children}</div>}
    </div>
  );
}

// 숫자 한 칸 (대시보드). children 은 숫자 아래 덧붙임(지난주보다 +3 등)
export function Stat({ label, value, children }: { label: ReactNode; value: ReactNode; children?: ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="text-body-small text-muted-foreground">{label}</div>
      <div className="mt-1 text-heading-2 font-semibold text-foreground tabular-nums">{value}</div>
      {children && <div className="mt-1 flex items-center gap-1 text-caption text-muted-foreground">{children}</div>}
    </div>
  );
}

// 바로가기 카드 (대시보드 · 설정). 아이콘 바탕은 한 가지 색(옥빛 옅은 면)으로 통일했다
export function EntryCard({ href, icon, title, desc }: { href: string; icon: IconName; title: ReactNode; desc?: ReactNode }) {
  return (
    <Link href={href} className="group flex w-full items-center gap-3 rounded-lg border border-border bg-card px-4 py-5 text-left transition-colors duration-100 hover:border-input hover:bg-ghost-hover active:bg-ghost-active">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground">
        <Icon name={icon} className="size-icon-sm" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-body-medium font-medium text-foreground">{title}</span>
        {desc && <span className="truncate text-caption text-muted-foreground">{desc}</span>}
      </span>
      <Icon name="chevron-right" className="size-4 text-muted-foreground transition-transform duration-100 group-hover:translate-x-0.5 motion-reduce:transition-none" />
    </Link>
  );
}

// 폼 한 칸의 틀: 라벨(칸 위) + 칸(children) + 도움말 · 오류. 모양은 ui/text-field 의 틀과 같다.
// 글 입력칸은 ui/text-field 의 TextField · TextAreaField 를 쓰고, 이것은 선택 칸 · 칩 묶음 · 체크 묶음처럼 다른 칸에 쓴다.
// htmlFor 를 주면 <label>, 안 주면 묶음(role="group")으로 이름을 붙인다
export function Field({ label, htmlFor, required, hint, error, className, children }: { label: ReactNode; htmlFor?: string; required?: boolean; hint?: ReactNode; error?: ReactNode; className?: string; children: ReactNode }) {
  const labelId = useId();
  const name = (
    <>
      {label}
      {required && <span className="text-muted-foreground">(필수)</span>}
    </>
  );
  return (
    <div role={htmlFor ? undefined : "group"} aria-labelledby={htmlFor ? undefined : labelId} className={cn("flex flex-col gap-1.5", className)}>
      {htmlFor ? (
        <label htmlFor={htmlFor} className="flex items-baseline gap-1 text-body-medium text-foreground">
          {name}
        </label>
      ) : (
        <div id={labelId} className="flex items-baseline gap-1 text-body-medium text-foreground">
          {name}
        </div>
      )}
      {children}
      {hint && <p className="text-body-medium text-muted-foreground">{hint}</p>}
      {error && (
        <p role="alert" className="flex items-start gap-1 text-body-medium text-destructive">
          <Icon name="alert" className="mt-0.5 size-4" />
          {error}
        </p>
      )}
    </div>
  );
}

// 단축키 표시
export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="inline-block min-w-5 rounded-badge border border-b-2 border-input bg-card px-1 text-center font-mono text-caption text-foreground">{children}</kbd>;
}

// 0~100 막대. 값은 글자로도 함께 보여 준다(쓰는 쪽)
export function Meter({ value, label }: { value: number; label: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div role="meter" aria-label={label} aria-valuenow={v} aria-valuemin={0} aria-valuemax={100} className="h-2 overflow-hidden rounded-full border border-border bg-muted">
      {/* 폭은 값에 따라 달라 클래스로 줄 수 없다 */}
      <span className="block h-full bg-primary" style={{ width: `${v}%` }} />
    </div>
  );
}

// 맵기 도장: 서비스와 같은 그림(brand/SpiceStamp). 다시 그리지 않는다
export function Stamp({ n }: { n: number }) {
  return <SpiceStamp n={n as Spice} size={24} pill={false} />;
}

// 링크를 단추 모양으로 (머리글의 「직접 등록」 등). 서버 컴포넌트에서도 쓸 수 있게 buttonVariants 로 그린다
export function LinkButton({ href, variant = "outlined", size = "md", className, children, ...rest }: { href: string; variant?: "filled" | "tonal" | "outlined" | "text"; size?: "md" | "compact" | "xl"; className?: string; children: ReactNode } & Omit<React.ComponentProps<typeof Link>, "href" | "className" | "children">) {
  return (
    <Link href={href} className={cn(buttonVariants({ variant, size }), className)} {...rest}>
      {children}
    </Link>
  );
}

// 운영 권한이 없을 때 (lib/admin/access.ts). login = 열쇠로 로그인 · locked = 이 컴퓨터 밖이라 열쇠(ADMIN_KEY)가 있어야 열림
export function Locked({ why }: { why: "login" | "locked" }) {
  return (
    <Empty
      icon="alert"
      title={why === "login" ? "운영 로그인이 필요해요" : "이 주소에서는 운영 화면이 잠겨 있어요"}
      desc={
        why === "login"
          ? "운영 열쇠를 넣은 브라우저에서만 가게 정보를 보고 고칠 수 있어요."
          : "열쇠 없이 여는 건 이 컴퓨터(127.0.0.1)에서만 돼요. 밖에서 열려면 서버에 ADMIN_KEY 를 넣고 로그인해요."
      }
    >
      <LinkButton href="/admin/login" variant="filled">
        운영 로그인
      </LinkButton>
    </Empty>
  );
}
