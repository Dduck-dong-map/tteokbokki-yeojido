"use client";

import Link from "next/link";
import { useState } from "react";
import { LIST_VISIBILITY, timeAgo, type PlaceList } from "@/lib/community";
import { send } from "@/lib/me";
import { refreshOwned, useOwned } from "@/lib/owned";
import type { Store } from "@/lib/types";
import { SpiceStamp } from "@/components/brand";
import { cn } from "@/lib/utils";

// 리스트 카드: 이름 · 설명 한 줄 · 담긴 가게 도장 · N곳 · 만든 사람 · 추천 수
export function ListCard({ list, stores, now, showVisibility = false }: { list: PlaceList; stores: Map<string, Store>; now: Date; showVisibility?: boolean }) {
  const inList = list.storeIds.map((id) => stores.get(id)).filter((s): s is Store => !!s);
  return (
    <Link href={`/lists/${list.id}`} className="flex h-full flex-col gap-2 rounded-2xl border border-border bg-card p-3.5 transition-shadow hover:shadow-md">
      <div className="flex items-start gap-2">
        <h3 className="min-w-0 flex-1 text-[15px] leading-snug font-bold">{list.title}</h3>
        <span className="shrink-0 rounded-full bg-secondary px-2 text-[12px] leading-6 font-semibold text-muted-foreground" aria-label={`추천 ${list.likes}`}>
          👍 {list.likes}
        </span>
      </div>
      {list.desc && <p className="line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">{list.desc}</p>}
      <div className="flex items-center gap-1.5" aria-hidden="true">
        {inList.slice(0, 6).map((s) => (
          <SpiceStamp key={s.id} n={s.spice} size={22} pill={false} />
        ))}
        {inList.length > 6 && <span className="text-[12px] text-muted-foreground/70">+{inList.length - 6}</span>}
      </div>
      <p className="mt-auto truncate text-[12px] text-muted-foreground/70">
        {inList.length}곳 · {list.who} · {timeAgo(list.updatedAt, now)}
        {showVisibility && list.visibility === "link" && <> · 🔗 {LIST_VISIBILITY.link}</>}
      </p>
    </Link>
  );
}

// 추천(엄지척): 누르면 +1, 다시 누르면 취소. 내 리스트·내 글은 숫자만 보인다. 맛집 리스트와 떡볶이방 글이 같이 쓴다.
export function LikeButton({ id, likes, kind = "list" }: { id: string; likes: number; kind?: "list" | "post" }) {
  const { data } = useOwned();
  const mine = kind === "list" ? data.lists.some((l) => l.id === id) : data.posts.includes(id);
  const serverLiked = (kind === "list" ? data.liked : data.likedPosts).includes(id);
  const [local, setLocal] = useState<{ liked: boolean; likes: number } | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const liked = local?.liked ?? serverLiked;
  const count = local?.likes ?? likes;
  const what = kind === "list" ? "리스트" : "글";

  const press = async () => {
    const res = (await (kind === "list" ? send(`/api/lists/${id}`, { action: "like" }) : send("/api/room", { action: "like", id }))) as {
      ok: boolean;
      error?: string;
      liked?: boolean;
      likes?: number;
    };
    if (!res.ok) return setMsg(res.error ?? "보내지 못했어요");
    setLocal({ liked: !!res.liked, likes: res.likes ?? count });
    setMsg(null);
    void refreshOwned();
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={press}
        disabled={mine}
        aria-pressed={liked}
        title={mine ? (kind === "list" ? "내 리스트는 추천할 수 없어요" : "내 글은 추천할 수 없어요") : liked ? "추천 취소" : `이 ${what} 추천하기`}
        className={cn(
          "flex h-10 items-center gap-1.5 rounded-xl border px-3.5 text-[14px] font-bold transition-transform active:scale-95 disabled:active:scale-100",
          liked ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card text-foreground",
        )}
      >
        <span aria-hidden="true">👍</span>
        {mine ? "추천" : liked ? "추천함" : "추천"} <span className="tabular-nums">{count}</span>
      </button>
      {msg && (
        <span role="status" className="text-[12px] text-muted-foreground/70">
          {msg}
        </span>
      )}
    </div>
  );
}

// 공유: 폰은 공유 창, PC는 주소 복사
export function ShareListButton({ title }: { title: string }) {
  const [done, setDone] = useState(false);
  const share = async () => {
    const url = window.location.href.split("?")[0];
    try {
      if (navigator.share) await navigator.share({ title: `${title} · 떡볶여지도`, url });
      else {
        await navigator.clipboard.writeText(url);
        setDone(true);
        setTimeout(() => setDone(false), 1600);
      }
    } catch {
      // 공유 창을 닫은 경우
    }
  };
  return (
    <button type="button" onClick={share} className="flex h-10 items-center gap-1.5 rounded-xl border border-input bg-card px-3.5 text-[14px] font-bold text-foreground">
      {done ? "링크 복사됨 ✓" : "공유"}
    </button>
  );
}
