import { EXPIRE_DAYS, STALE_DAYS } from "./taxonomy";
import type { Hours, Store } from "./types";

const DAY = 86_400_000;

export type Freshness = "fresh" | "stale" | "expired";

export function daysSince(date: string, now: Date) {
  return Math.floor((now.getTime() - new Date(date + "T00:00:00+09:00").getTime()) / DAY);
}

export function freshness(store: Pick<Store, "lastConfirmedAt">, now: Date): Freshness {
  const d = daysSince(store.lastConfirmedAt, now);
  if (d > EXPIRE_DAYS) return "expired";
  if (d > STALE_DAYS) return "stale";
  return "fresh";
}

export function confirmedAgo(date: string, now: Date) {
  const d = daysSince(date, now);
  if (d <= 0) return "오늘";
  if (d < 7) return `${d}일 전`;
  if (d < 60) return `${Math.floor(d / 7)}주 전`;
  return `${Math.floor(d / 30)}달 전`;
}

// 한국 시간 기준 지금 영업 중인지
export function isOpenNow(hours: Hours, now: Date) {
  const kst = new Date(now.getTime() + 9 * 3_600_000);
  const day = kst.getUTCDay();
  const mins = kst.getUTCHours() * 60 + kst.getUTCMinutes();
  const toMin = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  const open = toMin(hours.open);
  const close = toMin(hours.close);
  if (close > open) return hours.days.includes(day) && mins >= open && mins < close;
  // 자정을 넘기는 가게: 오늘 연 뒤이거나, 어제 열어서 아직 안 닫았거나
  const yesterday = (day + 6) % 7;
  return (hours.days.includes(day) && mins >= open) || (hours.days.includes(yesterday) && mins < close);
}

export const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

export function hoursText(hours: Hours) {
  const off = DAY_NAMES.filter((_, i) => !hours.days.includes(i));
  const time = `${hours.open} ~ ${hours.close}`;
  return off.length ? `${time} · ${off.join("·")} 쉼` : `${time} · 매일`;
}
