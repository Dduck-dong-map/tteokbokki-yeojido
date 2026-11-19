"use client"

import * as React from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

// 디자인 시스템 FilterChip (docs/design-system/components/FilterChip.md)
// 고르는 단추. aria-pressed 로 켜짐을 알리고, 켜지면 바탕색과 체크 아이콘이 함께 붙는다(색만으로 구분하지 않는다).
// 보이는 높이 32px · 누르는 영역 48px(.hit-target) · 모서리 radius-8 · 글자 body-medium · 테두리 border-strong.
// 켜짐은 data-selected="true" 로 그린다(shadcn/tailwind.css 의 data-selected 변형이 이 값을 본다). 묶음은 쓰는 쪽이 fieldset + legend 로 감싸고 칩 사이는 space-8(gap-2)로 둔다.
// 안 고른 칩: 테두리 + 면 바탕, hover · active 는 interactive-ghost-*
const OFF_OUTLINED =
  "not-data-selected:border-input not-data-selected:bg-card not-data-selected:text-muted-foreground not-data-selected:hover:bg-ghost-hover not-data-selected:active:bg-ghost-active"
// 고른 칩: interactive-primary 세 단계
const ON_FILLED =
  "data-selected:border-primary data-selected:bg-primary data-selected:text-primary-foreground data-selected:hover:bg-primary-hover data-selected:active:bg-primary-active"

const chipVariants = cva(
  "hit-target inline-flex shrink-0 items-center justify-center gap-1 border whitespace-nowrap transition-colors duration-100 select-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      tone: {
        // 필터 · 폼의 고르기: 켜지면 옥빛 채움
        filled: cn(OFF_OUTLINED, ON_FILLED),
        // 「다녀옴」처럼 주 행동이 아닌 켜짐 · 그림이 든 칸(tile): 켜지면 옥빛 테두리 + 옅은 옥빛 바탕
        tonal: cn(
          OFF_OUTLINED,
          "data-selected:border-primary data-selected:bg-secondary data-selected:text-secondary-foreground data-selected:hover:bg-secondary-hover data-selected:active:bg-secondary-active"
        ),
        // 제목 옆 정렬 줄: 안 고른 것은 테두리 · 바탕 없이 글자만
        ghost: cn(
          "not-data-selected:border-transparent not-data-selected:bg-transparent not-data-selected:text-muted-foreground not-data-selected:hover:bg-ghost-hover not-data-selected:active:bg-ghost-active",
          ON_FILLED
        ),
      },
      size: {
        // 제목 옆 정렬 줄처럼 좁은 자리 (보이는 높이 28px)
        sm: "h-7 px-2.5 text-body-small [&>svg:not([class*='size-'])]:size-4",
        default:
          "h-8 px-3 text-body-medium [&>svg:not([class*='size-'])]:size-icon-sm",
        // 등록 폼처럼 칩이 곧 입력인 자리 (보이는 높이 40px)
        lg: "h-10 px-4 text-body-medium [&>svg:not([class*='size-'])]:size-icon-sm",
      },
      shape: {
        default: "rounded-control",
        // 탭 알약 (radius-full)
        pill: "rounded-full",
        // 그림(맵기 도장) + 글자를 세로로 쌓는 칸. 체크는 오른쪽 위에 뜬다
        tile: "relative h-auto min-h-target-min flex-col rounded-lg px-2 py-2 whitespace-normal",
      },
    },
    defaultVariants: {
      tone: "filled",
      size: "default",
      shape: "default",
    },
  }
)

type ChipProps = Omit<ButtonPrimitive.Props, "className" | "onChange"> &
  VariantProps<typeof chipVariants> & {
    className?: string
    // 제어형: selected + onChange. 비제어형: defaultSelected
    selected?: boolean
    defaultSelected?: boolean
    // 누르면 다음 값(지금의 반대)을 알린다. 하나만 고르는 줄(정렬 · 탭)은 true 일 때만 받아 쓴다
    onChange?: (selected: boolean) => void
    // 켜졌을 때 체크 아이콘. 끄면 켜짐이 색으로만 보이므로 글자(「다녀옴 ✓」)나 다른 표시가 있을 때만 끈다
    check?: boolean
  }

function Chip({
  className,
  tone = "filled",
  size = "default",
  shape = "default",
  selected: selectedProp,
  defaultSelected = false,
  onChange,
  onClick,
  check = true,
  children,
  ...props
}: ChipProps) {
  const [innerSelected, setInnerSelected] = React.useState(defaultSelected)
  const selected = selectedProp ?? innerSelected

  return (
    <ButtonPrimitive
      data-slot="chip"
      data-selected={selected ? "true" : undefined}
      // 탭 줄(role="tab")에서는 aria-selected, 그 밖에는 aria-pressed 로 켜짐을 알린다
      {...(props.role === "tab"
        ? { "aria-selected": selected }
        : { "aria-pressed": selected })}
      className={cn(chipVariants({ tone, size, shape }), className)}
      {...props}
      onClick={(event) => {
        onClick?.(event)
        if (selectedProp === undefined) setInnerSelected(!selected)
        onChange?.(!selected)
      }}
    >
      {selected && check && (
        <Check
          data-slot="chip-check"
          className={cn(shape === "tile" && "absolute top-1 right-1")}
          strokeWidth={2}
          aria-hidden="true"
        />
      )}
      {children}
    </ButtonPrimitive>
  )
}

export { Chip, chipVariants }
