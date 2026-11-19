import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

import { fieldClassName } from "./input"

// variant="default" 는 shadcn 원본 그대로다.
// variant="field" 는 디자인 시스템 TextField 의 채운형 칸을 여러 줄로 쓴 것이다(가게 소개). 모양은 input.tsx 의 field 와 같고 높이만 내용에 따라 늘어난다.
const textareaVariants = cva("", {
  variants: {
    variant: {
      default:
        "flex field-sizing-content min-h-16 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
      field: cn(fieldClassName, "flex field-sizing-content min-h-field py-3"),
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

function Textarea({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"textarea"> & VariantProps<typeof textareaVariants>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(textareaVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Textarea, textareaVariants }
