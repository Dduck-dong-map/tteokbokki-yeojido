import * as React from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// 디자인 시스템 Fab (docs/design-system/components/Fab.md)
// 제보 FAB. 지도 화면 오른쪽 아래에 하나만 둔다. 바탕 interactive-accent(제보 갈색) 세 단계 · 그림자 elevation-3 · 모서리 radius-12 · 높이 fab-size 56px.
// 고대비 테마는 그림자가 없어 border-strong 테두리로 나눈다. 포커스는 그림자와 겹치지 않게 outline 으로 그린다.
// 자리는 쓰는 쪽이 정한다(아래 탐색 막대 · 시트 위 space-16 + 안전 영역).
// 링크로 쓸 때: <Link className={fabVariants()}> 또는 <Fab nativeButton={false} render={<Link href="…" />} />
const fabVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-report text-body-large whitespace-nowrap text-report-foreground shadow-elevation-3 transition-colors duration-100 select-none hover:bg-report-hover focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring active:bg-report-active disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none hc:border hc:border-input [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-icon-md",
  {
    variants: {
      size: {
        // 글자가 있는 넓은 FAB (기본)
        extended: "h-fab min-w-fab px-5",
        // 지도를 움직이는 동안 줄인 56px. 글자 대신 aria-label 이 남는다
        icon: "size-fab",
      },
    },
    defaultVariants: {
      size: "extended",
    },
  }
)

type FabProps = Omit<ButtonPrimitive.Props, "className"> &
  VariantProps<typeof fabVariants> & {
    className?: string
    // 보이는 글자이자 size="icon" 일 때의 aria-label
    label?: string
    icon?: React.ReactNode
  }

function Fab({
  className,
  size = "extended",
  label = "제보하기",
  icon,
  children,
  ...props
}: FabProps) {
  const iconOnly = size === "icon" && children == null

  return (
    <ButtonPrimitive
      data-slot="fab"
      aria-label={iconOnly ? label : undefined}
      className={cn(fabVariants({ size }), className)}
      {...props}
    >
      {icon}
      {children ?? (iconOnly ? null : label)}
    </ButtonPrimitive>
  )
}

export { Fab, fabVariants }
