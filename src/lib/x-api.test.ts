import assert from "node:assert/strict";
import test from "node:test";
import { createXPost, refreshXAccessToken, uploadXImage } from "./x-api.ts";

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

test("refreshXAccessToken sends OAuth refresh request and returns rotated tokens", async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const fetcher = async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init });
    return jsonResponse({
      access_token: "new-access-token",
      refresh_token: "new-refresh-token",
      expires_in: 7200,
    });
  };

  const before = Math.floor(Date.now() / 1000);
  const result = await refreshXAccessToken("old-refresh-token", "client-id", "client-secret", fetcher as typeof fetch);

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://api.twitter.com/2/oauth2/token");
  assert.equal(calls[0].init?.method, "POST");
  assert.equal((calls[0].init?.headers as Record<string, string>).Authorization, "Basic Y2xpZW50LWlkOmNsaWVudC1zZWNyZXQ=");
  assert.equal((calls[0].init?.headers as Record<string, string>)["Content-Type"], "application/x-www-form-urlencoded");
  assert.equal(String(calls[0].init?.body), "grant_type=refresh_token&refresh_token=old-refresh-token&client_id=client-id");
  assert.deepEqual(result, {
    accessToken: "new-access-token",
    refreshToken: "new-refresh-token",
    expiresAt: result.expiresAt,
  });
  assert.ok(result.expiresAt && result.expiresAt >= before + 7199);
});
