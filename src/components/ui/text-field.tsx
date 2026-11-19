import * as React from "react"
import { CircleAlert } from "lucide-react"

import { cn } from "@/lib/utils"

import { Input } from "./input"
import { Textarea } from "./textarea"

// 디자인 시스템 TextField (docs/design-system/components/TextField.md)
// 채운형 칸(input.tsx · textarea.tsx 의 variant="field"). 라벨은 항상 칸 위에 보이고 placeholder 는 예시만 담는다.
// 필수는 라벨 끝 「(필수)」 글자로. 도움말 · 오류는 aria-describedby 로 칸과 묶인다.
// 오류: border-error 테두리 + 오류 아이콘 + 고치는 방법 한 문장, aria-invalid · role="alert".
type FieldFrameProps = {
  // 주지 않으면 useId 로 만든다
  id?: string
  label: React.ReactNode
  help?: React.ReactNode
  error?: React.ReactNode
  // 라벨 · 칸 · 도움말을 감싼 바깥 틀의 클래스. className 은 칸에 간다
  fieldClassName?: string
}

type TextFieldProps = Omit<React.ComponentProps<"input">, "id"> & FieldFrameProps
type TextAreaFieldProps = Omit<React.ComponentProps<"textarea">, "id"> &
  FieldFrameProps

// 라벨 · 도움말 · 오류 틀. 칸은 children 함수가 id · aria 속성을 받아 그린다
function FieldFrame({
  id,
  label,
  help,
  error,
  required,
  fieldClassName,
  children,
}: FieldFrameProps & {
  required?: boolean
  children: (control: {
    id: string
    "aria-invalid": true | undefined
    "aria-describedby": string | undefined
  }) => React.ReactNode
}) {
  const autoId = React.useId()
  const fieldId = id ?? autoId
  const helpId = help ? `${fieldId}-help` : undefined
  const errorId = error ? `${fieldId}-error` : undefined

  return (
    <div
      data-slot="text-field"
      className={cn("flex flex-col gap-1.5", fieldClassName)}
    >
      <label
        htmlFor={fieldId}
        data-slot="text-field-label"
        className="flex items-baseline gap-1 text-body-medium text-foreground"
      >
        {label}
        {required && <span className="text-muted-foreground">(필수)</span>}
      </label>
      {children({
        id: fieldId,
        "aria-invalid": error ? true : undefined,
        "aria-describedby":
          [helpId, errorId].filter(Boolean).join(" ") || undefined,
      })}
      {help && (
        <p
          id={helpId}
          data-slot="text-field-help"
          className="text-body-medium text-muted-foreground"
        >
          {help}
        </p>
      )}
      {error && (
        <p
          id={errorId}
          role="alert"
          data-slot="text-field-error"
          className="flex items-start gap-1 text-body-medium text-destructive"
        >
          <CircleAlert
            className="mt-0.5 size-icon-sm shrink-0"
            aria-hidden="true"
          />
          {error}
        </p>
      )}
    </div>
  )
}

function TextField({
  id,
  label,
  help,
  error,
  required,
  fieldClassName,
  ...props
}: TextFieldProps) {
  return (
    <FieldFrame
      id={id}
      label={label}
      help={help}
      error={error}
      required={required}
      fieldClassName={fieldClassName}
    >
      {(control) => (
        <Input variant="field" required={required} {...control} {...props} />
      )}
    </FieldFrame>
  )
}

function TextAreaField({
  id,
  label,
  help,
  error,
  required,
  fieldClassName,
  ...props
}: TextAreaFieldProps) {
  return (
    <FieldFrame
      id={id}
      label={label}
      help={help}
      error={error}
      required={required}
      fieldClassName={fieldClassName}
    >
      {(control) => (
        <Textarea variant="field" required={required} {...control} {...props} />
      )}
    </FieldFrame>
  )
}

export { TextField, TextAreaField }
