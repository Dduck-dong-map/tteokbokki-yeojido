"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MAX_COMMENT, checkComment, timeAgo, type PostComment } from "@/lib/community";
import { send, useMe } from "@/lib/me";
import { refreshOwned, useOwned } from "@/lib/owned";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// 글 아래: 내 글이면 「지우기」, 아니면 「신고」. 지우기는 화면 안에서 한 번 더 묻는다 (확인 창은 쓰지 않는다).
export function PostActions({ id }: { id: string }) {
  const router = useRouter();
  const { data } = useOwned();
  const mine = data.posts.includes(id);
  const [asking, setAsking] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const remove = async () => {
    const res = await send("/api/room", { action: "delete", id });
    if (!res.ok) return setMsg(res.error ?? "지우지 못했어요");
    void refreshOwned();
    router.push("/room");
    router.refresh();
  };
  const flag = async () => {
    const res = await send("/api/room", { action: "flag", id });
    setMsg(res.ok ? "신고했어요. 여러 명이 신고하면 글이 가려져요" : (res.error ?? "보내지 못했어요"));
  };

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 text-body-small">
      {msg && <span className="mr-auto min-w-0 break-keep text-muted-foreground/70 [overflow-wrap:anywhere]">{msg}</span>}
      {mine ? (
        asking ? (
          <>
            <span className="text-muted-foreground">이 글을 지울까요?</span>
            <button type="button" onClick={remove} className={cn("hit h-8 rounded-lg bg-spicybg px-3 font-semibold text-spicytext")}>
              지우기
            </button>
            <Button type="button" variant="outlined" size="compact" onClick={() => setAsking(false)}>
              그만두기
            </Button>
          </>
        ) : (
          <Button type="button" variant="text" size="compact" onClick={() => setAsking(true)}>
            글 지우기
          </Button>
        )
      ) : (
        <Button type="button" variant="text" size="compact" onClick={flag}>
          신고
        </Button>
      )}
    </div>
  );
}

// 댓글: 오래된 것부터, 맨 아래 입력칸. 내 댓글은 지우기, 남의 댓글은 신고.
export function Comments({ postId, comments, nowIso }: { postId: string; comments: PostComment[]; nowIso: string }) {
  const router = useRouter();
  const me = useMe();
  const { data } = useOwned();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const now = new Date(nowIso);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = checkComment(text);
    if (err) return setMsg(err);
    setBusy(true);
    const res = await send("/api/room", { action: "comment", id: postId, text });
    setBusy(false);
    if (!res.ok) return setMsg(res.error ?? "올리지 못했어요");
    setText("");
    setMsg(null);
    void refreshOwned();
    router.refresh();
  };
  const act = async (action: "delete-comment" | "flag-comment", id: string) => {
    const res = await send("/api/room", { action, id });
    if (!res.ok) return setMsg(res.error ?? "보내지 못했어요");
    if (action === "flag-comment") setMsg("신고했어요. 여러 명이 신고하면 댓글이 가려져요");
    void refreshOwned();
    router.refresh();
  };

  return (
    <section className="flex flex-col gap-2 border-t border-border pt-3.5" aria-label="댓글">
      <h2 className="text-body-medium">댓글 {comments.length}</h2>
      {comments.length > 0 && (
        <ul className="divide-y divide-border">
          {comments.map((c) => (
            <li key={c.id} className="py-2.5">
              <p className="flex items-center gap-1.5 text-caption text-muted-foreground/70">
                <b className="min-w-0 truncate font-semibold text-muted-foreground">{c.who}</b>
                <span className="shrink-0">· {timeAgo(c.at, now)}</span>
                <Button
                  type="button"
                  variant="text"
                  size="compact"
                  onClick={() => act(data.comments.includes(c.id) ? "delete-comment" : "flag-comment", c.id)}
                  className="ml-auto"
                >
                  {data.comments.includes(c.id) ? "지우기" : "신고"}
                </Button>
              </p>
              <p className="mt-1 text-body-small leading-relaxed break-keep whitespace-pre-line [overflow-wrap:anywhere]">{c.text}</p>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={submit} className="mt-1 flex flex-col gap-2">
        {/* 디자인 시스템 칸(variant="field" · 18px): 폰에서 16px 보다 작으면 사파리가 화면을 확대한다. 높이는 내용 따라 늘어난다 */}
        <Textarea
          id="comment-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={MAX_COMMENT}
          rows={2}
          placeholder={`${me.nick || "닉네임"} 으로 댓글 남기기`}
          aria-label="댓글"
          variant="field"
        />
        <div className="flex items-center gap-2">
          {msg && (
            <span role="status" className="min-w-0 text-body-small break-keep text-muted-foreground/70 [overflow-wrap:anywhere]">
              {msg}
            </span>
          )}
          <Button type="submit" variant="filled" size="md" disabled={busy || !text.trim()} className="ml-auto">
            {busy ? "올리는 중…" : "댓글 달기"}
          </Button>
        </div>
      </form>
    </section>
  );
}
