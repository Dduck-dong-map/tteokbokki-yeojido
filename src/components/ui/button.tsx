import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// 디자인 시스템 Button (docs/design-system/components/Button.md) 의 종류 · 크기를 shadcn 원본 옆에 더했다.
// 종류 filled(주 행동, 화면에 하나) · tonal(두 번째 행동) · outlined(보조) · text(가장 약한 행동), 크기 md(보이는 높이 40px) · xl · compact · icon-md · icon-xl.
// 새 크기는 알약(radius-full)이고 누르는 영역은 .hit-target 으로 target-min 48px 까지 넓힌다. 포커스는 border-focus 3px 실선 · 2px 띄움.
// shadcn 원본 종류(default · outline · secondary · ghost · destructive · link)와 크기(default · xs · sm · lg · icon*)는 그대로다.
const DS_FOCUS =
  "focus-visible:ring-0 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary-hover aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
        // ── 디자인 시스템 종류: 기본 · hover · active 세 단계, 쓸 수 없을 때는 interactive-disabled · text-disabled
        filled: cn(
          "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active disabled:bg-disabled disabled:text-disabled-foreground disabled:opacity-100",
          DS_FOCUS
        ),
        tonal: cn(
          "bg-secondary text-secondary-foreground hover:bg-secondary-hover active:bg-secondary-active disabled:bg-disabled disabled:text-disabled-foreground disabled:opacity-100",
          DS_FOCUS
        ),
        outlined: cn(
          "border-input bg-transparent text-foreground hover:bg-ghost-hover active:bg-ghost-active disabled:border-disabled disabled:text-disabled-foreground disabled:opacity-100",
          DS_FOCUS
        ),
        text: cn(
          "text-link hover:bg-ghost-hover active:bg-ghost-active disabled:text-disabled-foreground disabled:opacity-100",
          DS_FOCUS
        ),
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
        // ── 디자인 시스템 크기: 알약 · 글자 토큰 · 누르는 영역 48px(.hit-target)
        md: "hit-target h-10 gap-2 rounded-full px-6 text-body-large [&_svg:not([class*='size-'])]:size-icon-sm",
        xl: "h-12 gap-2 rounded-full px-6 text-body-large [&_svg:not([class*='size-'])]:size-icon-sm",
        compact:
          "hit-target h-8 gap-1 rounded-full px-3 text-body-small [&_svg:not([class*='size-'])]:size-4",
        // 아이콘만 있는 버튼: 쓰는 쪽이 aria-label 을 준다
        "icon-md":
          "hit-target size-10 rounded-full [&_svg:not([class*='size-'])]:size-icon-md",
        "icon-xl":
          "size-target-min rounded-full [&_svg:not([class*='size-'])]:size-icon-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
