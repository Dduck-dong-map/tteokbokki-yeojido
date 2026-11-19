import { afterEach, describe, expect, it, vi } from "vitest";
import { MAX_JSON_BYTES, checkOrigin, readJson } from "@/lib/request";

// 쓰기 입구 검사 (lib/request.ts readJson · checkOrigin, 기술 스택 9절 #7).
// 브라우저가 보내는 모양을 Request 로 흉내 낸다. Node 의 Request 는 host · origin · sec-fetch-site 를 그대로 둔다.

const URL_E2E = "http://127.0.0.1:3101/api/stores";

function post(url: string, headers: Record<string, string>, body: BodyInit | null = JSON.stringify({ action: "still", nick: "손님" })) {
  return new Request(url, { method: "POST", headers, body });
}

const json = { "content-type": "application/json" };

async function status(res: Response | Record<string, unknown>) {
  return res instanceof Response ? res.status : 200;
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("같은 출처 JSON 은 통과", () => {
  it("E2E 서버(127.0.0.1:3101)에서 연 화면이 보낸 요청", async () => {
    const body = await readJson(post(URL_E2E, { ...json, host: "127.0.0.1:3101", origin: "http://127.0.0.1:3101", "sec-fetch-site": "same-origin" }));
    expect(body).toEqual({ action: "still", nick: "손님" });
  });

  it("개발 서버(localhost:3000) · charset 이 붙은 Content-Type", async () => {
    const body = await readJson(post("http://localhost:3000/api/room", { "content-type": "application/json; charset=utf-8", host: "localhost:3000", origin: "http://localhost:3000" }));
    expect(body).toEqual({ action: "still", nick: "손님" });
  });

  it("배포 주소(NEXT_PUBLIC_SITE_URL)와 같은 Origin 은 Host 가 달라도(프록시 뒤) 통과", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://ddy.example.com");
    const body = await readJson(post("http://10.0.0.5:3000/api/stores", { ...json, host: "10.0.0.5:3000", origin: "https://ddy.example.com" }));
    expect(await status(body)).toBe(200);
  });

  it("X-Forwarded-Host 와 같은 Origin 도 통과 (Server Action 과 같은 규칙)", async () => {
    const body = await readJson(post("http://internal:3000/api/stores", { ...json, host: "internal:3000", "x-forwarded-host": "ddy.vercel.app", origin: "https://ddy.vercel.app" }));
    expect(await status(body)).toBe(200);
  });

  it("Origin · Sec-Fetch-Site 가 모두 없는 요청(curl · 서버)은 통과", async () => {
    expect(await status(await readJson(post(URL_E2E, { ...json, host: "127.0.0.1:3101" })))).toBe(200);
  });

  it("Origin 이 없어도 Sec-Fetch-Site: same-origin 이면 통과", async () => {
    expect(await status(await readJson(post(URL_E2E, { ...json, "sec-fetch-site": "same-origin" })))).toBe(200);
  });

  it("한도에 딱 맞는 본문은 통과", async () => {
    const pad = "가".repeat(Math.floor((MAX_JSON_BYTES - 20) / 3));
    const text = JSON.stringify({ body: pad });
    expect(Buffer.byteLength(text)).toBeLessThanOrEqual(MAX_JSON_BYTES);
    expect(await status(await readJson(post(URL_E2E, { ...json, origin: "http://127.0.0.1:3101" }, text)))).toBe(200);
  });
});

describe("다른 출처는 거절 (403)", () => {
  it("다른 사이트의 text/plain POST (사전 확인 없이 보낼 수 있는 모양)", async () => {
    const res = await readJson(post(URL_E2E, { "content-type": "text/plain", host: "127.0.0.1:3101", origin: "https://evil.example", "sec-fetch-site": "cross-site" }));
    expect(res).toBeInstanceOf(Response);
    expect((res as Response).status).toBe(403);
    expect(await (res as Response).json()).toMatchObject({ ok: false });
  });

  it("다른 사이트의 application/json POST 도", async () => {
    expect(await status(await readJson(post(URL_E2E, { ...json, host: "127.0.0.1:3101", origin: "https://evil.example" })))).toBe(403);
  });

  it("포트만 다른 로컬 주소 · localhost 를 이름에 넣은 도메인 · null Origin", async () => {
    for (const origin of ["http://127.0.0.1:3000", "http://localhost.evil.com:3101", "null"]) {
      expect(await status(await readJson(post(URL_E2E, { ...json, host: "127.0.0.1:3101", origin }))), origin).toBe(403);
    }
  });

  it("Origin 없이 Sec-Fetch-Site 가 cross-site · same-site 면", async () => {
    for (const site of ["cross-site", "same-site"]) {
      expect(await status(await readJson(post(URL_E2E, { ...json, "sec-fetch-site": site }))), site).toBe(403);
    }
  });

  it("checkOrigin 은 사진 올리기(바이너리)에도 그대로 쓴다", () => {
    const photo = (origin: string) => new Request("http://127.0.0.1:3101/api/photos", { method: "POST", headers: { "content-type": "image/jpeg", host: "127.0.0.1:3101", origin }, body: new Uint8Array([0xff, 0xd8, 0xff]) });
    expect(checkOrigin(photo("http://127.0.0.1:3101"))).toBeNull();
    expect(checkOrigin(photo("https://evil.example"))?.status).toBe(403);
  });
});

describe("JSON 이 아니거나 너무 크거나 읽을 수 없으면 거절", () => {
  it("같은 출처여도 text/plain · form · Content-Type 없음은 415", async () => {
    for (const type of ["text/plain", "application/x-www-form-urlencoded", "multipart/form-data; boundary=x"]) {
      expect(await status(await readJson(post(URL_E2E, { "content-type": type, origin: "http://127.0.0.1:3101" }))), type).toBe(415);
    }
    // body 가 문자열이면 Request 가 text/plain 을 붙이므로, 바이트로 보내 Content-Type 을 비운다
    const none = post(URL_E2E, { origin: "http://127.0.0.1:3101" }, new TextEncoder().encode("{}"));
    expect(none.headers.get("content-type")).toBeNull();
    expect(await status(await readJson(none))).toBe(415);
  });

  it("한도를 넘는 본문은 413 (Content-Length 로 바로)", async () => {
    const big = JSON.stringify({ body: "a".repeat(MAX_JSON_BYTES) });
    expect(await status(await readJson(post(URL_E2E, { ...json, origin: "http://127.0.0.1:3101", "content-length": String(Buffer.byteLength(big)) }, big)))).toBe(413);
  });

  it("Content-Length 가 없어도(스트림) 읽으면서 세어 413", async () => {
    const chunk = new TextEncoder().encode("a".repeat(16 * 1024));
    let sent = 0;
    const stream = new ReadableStream<Uint8Array>({
      pull(c) {
        if (sent++ < 8) c.enqueue(chunk);
        else c.close();
      },
    });
    const req = new Request(URL_E2E, { method: "POST", headers: { ...json, origin: "http://127.0.0.1:3101" }, body: stream, duplex: "half" } as RequestInit & { duplex: "half" });
    expect(req.headers.get("content-length")).toBeNull();
    expect(await status(await readJson(req))).toBe(413);
  });

  it("JSON 이 깨졌거나 객체가 아니면 400", async () => {
    for (const text of ["{", "[1,2]", "null", "3", ""]) {
      expect(await status(await readJson(post(URL_E2E, { ...json, origin: "http://127.0.0.1:3101" }, text))), JSON.stringify(text)).toBe(400);
    }
  });
});
