import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { Db } from "@/lib/data/db";
import type { Store } from "@/lib/types";
import { SAMPLE_LISTS, SAMPLE_POSTS } from "./sample-community";
import { SAMPLE_HISTORY, SAMPLE_NEW, SAMPLE_REVIEWS, SAMPLE_STORES } from "./sample-stores";

// 시험용 저장소 채우기 (11-19). 앱은 빈 저장소로 시작하고, 시험만 이 자료(가게 16곳 · 글 · 리스트)로 채운 저장소에서 돈다.
// 날짜는 「며칠 전」으로 적혀 있어 부를 때마다 오늘 기준으로 만든다.

const isoDay = (t = Date.now()) => new Date(t + 9 * 3_600_000).toISOString().slice(0, 10);
const daysAgo = (n: number) => isoDay(Date.now() - n * 86_400_000);
const isoAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();
const SEED_MARK = { device: "seed", ip: "seed" };

export function seedDb(): Db {
  const stores: Store[] = SAMPLE_STORES.map((s) => {
    const fresh = SAMPLE_NEW[s.id];
    return fresh ? { ...s, createdAt: daysAgo(fresh.daysAgo), lastConfirmedAt: daysAgo(fresh.daysAgo), by: fresh.by, verify: fresh.verify } : { ...s };
  });
  return {
    stores,
    logs: [
      ...Object.entries(SAMPLE_NEW).map(([storeId, n]) => ({ ...SEED_MARK, id: `seed-new-${storeId}`, storeId, at: `${daysAgo(n.daysAgo)}T12:00:00+09:00`, who: n.by, kind: "new" as const })),
      ...SAMPLE_HISTORY.map((h, i) => ({ ...SEED_MARK, id: `seed-log-${i}`, storeId: h.storeId, at: `${daysAgo(h.daysAgo)}T12:00:00+09:00`, who: h.who, kind: "edit" as const, changes: h.changes })),
    ],
    reviews: SAMPLE_REVIEWS.map((r, i) => ({ ...SEED_MARK, id: `seed-rev-${i}`, storeId: r.storeId, at: `${daysAgo(r.daysAgo)}T12:00:00+09:00`, who: r.who, stars: r.stars, text: r.text })),
    votes: [],
    flags: [],
    posts: SAMPLE_POSTS.map((p) => ({ ...SEED_MARK, id: p.id, at: isoAgo(p.daysAgo), who: p.who, cat: p.cat, title: p.title, body: p.body, storeId: p.storeId, comments: p.comments.length, likes: p.likes })),
    comments: SAMPLE_POSTS.flatMap((p) => p.comments.map((c, i) => ({ ...SEED_MARK, id: `${p.id}-c${i}`, postId: p.id, at: isoAgo(p.daysAgo - 0.1 * (i + 1)), who: c.who, text: c.text }))),
    lists: SAMPLE_LISTS.map((l) => ({ ...SEED_MARK, id: l.id, title: l.title, desc: l.desc, storeIds: l.storeIds, who: l.who, createdAt: isoAgo(l.daysAgo), updatedAt: isoAgo(l.daysAgo), visibility: l.visibility, likes: l.likes })),
    likes: [],
    postLikes: [],
    goes: [],
    photoUploads: [],
    deletedWrites: [],
  };
}

// 파일 저장소 폴더(DATA_DIR)에 시험 자료를 써 둔다. db.ts 를 불러오기 전 · 뒤 어느 때 불러도 된다(파일 저장소는 요청마다 읽는다).
export function seedDataDir(dir: string) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, "db.json"), JSON.stringify(seedDb()));
}
