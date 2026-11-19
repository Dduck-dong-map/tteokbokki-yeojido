"use client";

import type { ReactNode } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Snackbar } from "@/components/ui/snackbar";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Icon } from "./Icon";

// 어드민 화면의 입력 조각 (이벤트를 받는 것 — 클라이언트 부품에서만 쓴다). 그리기만 하는 조각은 bits.tsx.

export type Option<T extends string = string> = { value: T; label: string };

// 고르는 칸 (ui/select). options 의 label 이 고른 값 자리에 보인다.
// size: toolbar = 표 도구 줄(높이 40px), field = 폼 칸(디자인 시스템 채운형 칸, 높이 56px)
// placeholder 를 주면 값이 "" 일 때 그 글이 흐리게 보인다(아직 안 고름). "" 이 보기 가운데 하나면(「없음」) options 에 넣고 placeholder 는 주지 않는다
export function PickSelect<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  id,
  size = "toolbar",
  placeholder,
  disabled,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: readonly Option<T>[];
  ariaLabel?: string;
  id?: string;
  size?: "toolbar" | "field";
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <Select items={options} value={placeholder && value === "" ? null : value} onValueChange={(v) => v !== null && onChange(v as T)} disabled={disabled}>
      <SelectTrigger
        id={id}
        aria-label={ariaLabel}
        className={cn(
          size === "field"
            ? "w-full rounded-control bg-muted px-4 text-body-large data-[size=default]:h-field"
            : "bg-card text-body-small data-[size=default]:h-10",
          className,
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// 찾기 칸 (표 도구 줄). 라벨이 안 보이므로 aria-label 을 준다
export function SearchInput({ value, onChange, placeholder, ariaLabel, className }: { value: string; onChange: (value: string) => void; placeholder: string; ariaLabel?: string; className?: string }) {
  return (
    <div className={cn("relative w-full sm:w-60", className)}>
      <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={ariaLabel ?? placeholder} className="h-10 bg-card pl-9 text-body-small" />
    </div>
  );
}

// 체크 칸 + 글 (ui/checkbox). 글 전체가 눌린다
export function CheckField({ checked, onChange, disabled, className, children }: { checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean; className?: string; children: ReactNode }) {
  return (
    <label className={cn("flex min-h-8 cursor-pointer items-center gap-2 text-body-small text-foreground has-disabled:cursor-not-allowed has-disabled:text-disabled-foreground", className)}>
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(v === true)} disabled={disabled} />
      <span className="min-w-0">{children}</span>
    </label>
  );
}

// 하나만 고르는 줄 (ui/radio-group). row = 옆으로 늘어놓기, 기본은 아래로
export function RadioList({ value, onChange, options, ariaLabel, row, className }: { value: string; onChange: (value: string) => void; options: readonly string[]; ariaLabel: string; row?: boolean; className?: string }) {
  return (
    <RadioGroup value={value} onValueChange={(v) => onChange(String(v))} aria-label={ariaLabel} className={cn(row ? "flex flex-wrap gap-x-4 gap-y-2" : "grid gap-2", className)}>
      {options.map((o) => (
        <label key={o} className="flex min-h-8 cursor-pointer items-center gap-2 text-body-small text-foreground">
          <RadioGroupItem value={o} />
          <span className="min-w-0">{o}</span>
        </label>
      ))}
    </RadioGroup>
  );
}

// 켜고 끄는 칸 + 글 (ui/switch)
export function SwitchField({ checked, onChange, disabled, className, children }: { checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean; className?: string; children: ReactNode }) {
  return (
    <label className={cn("flex min-h-8 cursor-pointer items-center gap-3 text-body-small text-foreground has-disabled:cursor-not-allowed has-disabled:text-disabled-foreground", className)}>
      <Switch checked={checked} onCheckedChange={(v) => onChange(v === true)} disabled={disabled} />
      <span className="min-w-0">{children}</span>
    </label>
  );
}

// 저장 결과를 잠깐 알리는 띠 (ui/snackbar). 띄우고 내리는 시간은 쓰는 쪽이 정한다
export function Toast({ children }: { children: ReactNode }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4 print:hidden">
      <Snackbar className="pointer-events-auto">{children}</Snackbar>
    </div>
  );
}
