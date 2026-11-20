import * as React from "react"

import { cn } from "@/lib/utils"

// 디자인 시스템 Snackbar (docs/design-system/components/Snackbar.md)
// 저장 · 제보 결과를 잠깐 알린다. 바탕 background-inverse · 글자 text-inverse · 행동 글자 text-inverse-action · 모서리 radius-8 · 그림자 elevation-3.
// role="status" 라 스크린 리더가 하던 일을 끊지 않고 읽는다. 행동은 하나까지(「되돌리기」).
// 띄우고 내리는 시간(최소 4초, 행동이 있으면 10초 이상, 마우스 · 포커스가 올라가 있으면 그대로)과 자리는 쓰는 쪽(컨테이너)이 정한다.
// 꼭 고쳐야 하는 오류는 스낵바가 아니라 화면 안 오류 띠(role="alert")로 알린다.
type SnackbarProps = React.ComponentProps<"div"> & {
  action?: React.ReactNode
  onAction?: () => void
}

function Snackbar({
  className,
  action,
  onAction,
  children,
  ...props
}: SnackbarProps) {
  return (
    <div
      role="status"
      data-slot="snackbar"
      className={cn(
        "inline-flex max-w-full items-center gap-4 rounded-control bg-inverse px-4 py-3 text-body-medium text-inverse-foreground shadow-elevation-3 hc:border hc:border-input",
        className
      )}
      {...props}
    >
      <span data-slot="snackbar-message" className="min-w-0">
        {children}
      </span>
      {action != null && (
        <button
          type="button"
          data-slot="snackbar-action"
          onClick={onAction}
          className="hit-target shrink-0 rounded-badge text-inverse-action underline-offset-4 hover:underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-inverse-foreground"
        >
          {action}
        </button>
      )}
    </div>
  )
}

export { Snackbar }
