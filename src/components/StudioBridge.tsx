"use client";

import { useEffect } from "react";

// 화면 설계 보드의 「화면 스튜디오」(docs/design/screens.html, 11-08)가 이 앱을 액자(iframe)로 띄워 놓고
// 파트별 색을 바꿔 볼 때만 쓴다. 액자 안이 아니면 아무것도 하지 않는다.
// 받는 것: { type: "ddy-studio-vars", vars: { paper: "#fff", … } } → :root 색 변수를 덮어쓴다 (저장하지 않음, 새로 고치면 원래대로)
// 보내는 것: { type: "ddy-studio-ready", path, vars } → 지금 화면의 원래 색 (스튜디오가 기본값으로 보여 준다)

export const STUDIO_VARS = [
  "paper", "bar", "surface", "panel", "chip",
  "ink", "ink2", "ink3", "line", "chipline",
  "primary", "onprimary", "fab", "onfab", "accent", "onaccent", "spicybg", "spicytext", "loc",
  "stampbg", "s1", "s2", "s3", "s4", "s5",
];

const HEX = /^#[0-9a-f]{3,8}$/i;

export default function StudioBridge() {
  useEffect(() => {
    if (window.parent === window) return;
    let style: HTMLStyleElement | null = null;

    const current = () => {
      const cs = getComputedStyle(document.documentElement);
      return Object.fromEntries(STUDIO_VARS.map((k) => [k, cs.getPropertyValue(`--${k}`).trim()]));
    };

    const onMessage = (e: MessageEvent) => {
      const d = e.data as { type?: string; vars?: Record<string, unknown> } | null;
      if (!d || d.type !== "ddy-studio-vars") return;
      if (!style) {
        style = document.createElement("style");
        style.id = "ddy-studio";
        document.head.appendChild(style);
      }
      const rows = Object.entries(d.vars ?? {}).filter(([k, v]) => STUDIO_VARS.includes(k) && typeof v === "string" && HEX.test(v));
      // 팔레트(:root[data-pal]) 보다 앞서도록 !important
      style.textContent = rows.length ? `:root{${rows.map(([k, v]) => `--${k}:${v} !important`).join(";")}}` : "";
    };

    window.addEventListener("message", onMessage);
    window.parent.postMessage({ type: "ddy-studio-ready", path: location.pathname + location.search, vars: current() }, "*");
    return () => window.removeEventListener("message", onMessage);
  }, []);
  return null;
}
