import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// variant="default" 는 shadcn 원본 그대로다.
// variant="field" 는 디자인 시스템 TextField(docs/design-system/components/TextField.md)의 채운형 칸:
// 바탕 background-tertiary · 테두리 border-strong · 높이 field-height 56px · 모서리 radius-8 · 글자 body-large(18px, iOS 가 확대하지 않는다).
// 포커스: 테두리가 interactive-primary 로 굵어지고 바깥에 border-focus 3px. 오류: border-error 로 굵어진다(aria-invalid).
const FIELD =
  "w-full min-w-0 rounded-control border border-input bg-muted px-4 text-body-large text-foreground transition-colors duration-100 placeholder:text-muted-foreground focus-visible:border-primary focus-visible:inset-ring-1 focus-visible:inset-ring-primary focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:border-disabled disabled:bg-disabled disabled:text-disabled-foreground aria-invalid:border-invalid aria-invalid:inset-ring-1 aria-invalid:inset-ring-invalid motion-reduce:transition-none"

const inputVariants = cva("", {
  variants: {
    variant: {
      default:
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
      field: cn(FIELD, "h-field"),
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

function Input({
  className,
  type,
  variant = "default",
  ...props
}: React.ComponentProps<"input"> & VariantProps<typeof inputVariants>) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(inputVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Input, inputVariants, FIELD as fieldClassName }
