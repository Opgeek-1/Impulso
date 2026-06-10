import assert from "node:assert/strict";
import test from "node:test";
import { createXPost, uploadXImage } from "./x-api";

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: init?.status || 200,
    headers: { "content-type": "application/json", ...(init?.headers || {}) },
  });
}

test("createXPost sends text-only payload to X", async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const fetcher = async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init });
    return jsonResponse({ data: { id: "post-1" } });
  };

  const postId = await createXPost("hello impulso", null, "token", fetcher as typeof fetch);

  assert.equal(postId, "post-1");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://api.x.com/2/tweets");
  assert.equal(calls[0].init?.method, "POST");
  assert.deepEqual(JSON.parse(String(calls[0].init?.body)), { text: "hello impulso" });
  assert.equal((calls[0].init?.headers as Record<string, string>).Authorization, "Bearer token");
});

test("uploadXImage sends media upload form data and returns media id", async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const image = Buffer.from("fake image").toString("base64");
  const fetcher = async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init });
    return jsonResponse({ data: { id: "media-1" } });
  };

  const mediaId = await uploadXImage(`data:image/png;base64,${image}`, "token", fetcher as typeof fetch);

  assert.equal(mediaId, "media-1");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://api.x.com/2/media/upload");
  assert.equal(calls[0].init?.method, "POST");
  assert.ok(calls[0].init?.body instanceof FormData);
});

test("createXPost surfaces X API errors", async () => {
  const fetcher = async () => jsonResponse({ detail: "rate limited" }, { status: 429 });

  await assert.rejects(
    createXPost("hello", null, "token", fetcher as typeof fetch),
    /rate limited/
  );
});
