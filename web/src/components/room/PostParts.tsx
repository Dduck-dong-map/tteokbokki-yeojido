"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MAX_COMMENT, checkComment, timeAgo, type PostComment } from "@/lib/community";
import { send, useMe } from "@/lib/me";
import { refreshOwned, useOwned } from "@/lib/owned";

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
    <div className="flex flex-wrap items-center justify-end gap-2 text-[13px]">
      {msg && <span className="mr-auto text-ink3">{msg}</span>}
      {mine ? (
        asking ? (
          <>
            <span className="text-ink2">이 글을 지울까요?</span>
            <button type="button" onClick={remove} className="hit h-8 rounded-lg bg-spicybg px-3 font-semibold text-spicytext">
              지우기
            </button>
            <button type="button" onClick={() => setAsking(false)} className="hit h-8 rounded-lg border border-chipline px-3 text-ink2">
              그만두기
            </button>
          </>
        ) : (
          <button type="button" onClick={() => setAsking(true)} className="hit text-ink3 underline underline-offset-2">
            글 지우기
          </button>
        )
      ) : (
        <button type="button" onClick={flag} className="hit text-ink3 underline underline-offset-2">
          신고
        </button>
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
    <section className="flex flex-col gap-2 border-t border-line pt-3.5" aria-label="댓글">
      <h2 className="text-[15px] font-bold">댓글 {comments.length}</h2>
      {comments.length > 0 && (
        <ul className="divide-y divide-line">
          {comments.map((c) => (
            <li key={c.id} className="py-2.5">
              <p className="flex items-center gap-1.5 text-[12px] text-ink3">
                <b className="font-semibold text-ink2">{c.who}</b>· {timeAgo(c.at, now)}
                <button type="button" onClick={() => act(data.comments.includes(c.id) ? "delete-comment" : "flag-comment", c.id)} className="hit ml-auto underline underline-offset-2">
                  {data.comments.includes(c.id) ? "지우기" : "신고"}
                </button>
              </p>
              <p className="mt-1 text-[14px] leading-relaxed whitespace-pre-line">{c.text}</p>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={submit} className="mt-1 flex flex-col gap-2">
        <textarea
          id="comment-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={MAX_COMMENT}
          rows={2}
          placeholder={`${me.nick || "닉네임"} 으로 댓글 남기기`}
          aria-label="댓글"
          className="rounded-xl border border-chipline bg-surface px-3 py-2 text-[14px] outline-none focus:border-ink"
        />
        <div className="flex items-center gap-2">
          {msg && (
            <span role="status" className="text-[12px] text-ink3">
              {msg}
            </span>
          )}
          <button type="submit" disabled={busy || !text.trim()} className="ml-auto grid h-9 place-items-center rounded-xl bg-primary px-4 text-[13px] font-bold text-onprimary disabled:opacity-50">
            {busy ? "올리는 중…" : "댓글 달기"}
          </button>
        </div>
      </form>
    </section>
  );
}
