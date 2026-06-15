import { readGeneratedImage } from "@/lib/image-files";

const X_API_BASE = "https://api.x.com";
const X_MEDIA_BASE = "https://api.x.com";
const X_OAUTH_TOKEN_URL = "https://api.twitter.com/2/oauth2/token";

type FetchLike = typeof fetch;

function xError(prefix: string, status: number, data: unknown) {
  const body = data as { detail?: string; title?: string; error?: string } | null;
  const message = body?.detail || body?.title || body?.error || "Unknown X API error";
  return `${prefix} (${status}): ${message}`;
}

function parseImageSource(imageUrl: string) {
  if (imageUrl.startsWith("data:")) {
    const match = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) throw new Error("Unsupported image data URL");
    return { mimeType: match[1], base64: match[2] };
  }

  if (!imageUrl.startsWith("http") && !imageUrl.startsWith("/")) {
    return { mimeType: "image/png", base64: imageUrl };
  }

  return null;
}

export interface XProfile {
  name: string;
  username: string;
  profile_image_url?: string;
}

export async function fetchXProfile(accessToken: string, fetcher: FetchLike = fetch): Promise<XProfile> {
  const res = await fetcher(`${X_API_BASE}/2/users/me?user.fields=name,username,profile_image_url`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.detail || data?.title || data?.error || "Failed to fetch X profile");
  }

  const user = data?.data;
  if (!user?.username) throw new Error("X profile did not return user data");
  return { name: user.name, username: user.username, profile_image_url: user.profile_image_url };
}

export async function uploadXImage(imageUrl: string, accessToken: string, fetcher: FetchLike = fetch) {
  const parsed = parseImageSource(imageUrl);
  let bytes: Buffer;
  let mimeType = parsed?.mimeType || "image/png";

  if (parsed) {
    bytes = Buffer.from(parsed.base64, "base64");
  } else if (imageUrl.startsWith("/")) {
    const localImage = await readGeneratedImage(imageUrl);
    if (!localImage) throw new Error("Unsupported local image path");
    bytes = localImage.bytes;
    mimeType = localImage.mimeType;
  } else {
    const res = await fetcher(imageUrl);
    if (!res.ok) throw new Error("Failed to fetch image for upload");
    const contentType = res.headers.get("content-type");
    if (contentType) mimeType = contentType.split(";")[0];
    bytes = Buffer.from(await res.arrayBuffer());
  }

  const body = new FormData();
  const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  body.set("media", new Blob([arrayBuffer], { type: mimeType }), "impulso-post-image.png");
  body.set("media_category", "tweet_image");

  const res = await fetcher(`${X_MEDIA_BASE}/2/media/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body,
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(xError("X media upload failed", res.status, data));
  }

  const mediaId = data?.data?.id || data?.media_id_string || data?.media_id;
  if (!mediaId) throw new Error("X media upload did not return a media id");
  return String(mediaId);
}

export async function createXPost(content: string, mediaId: string | null, accessToken: string, fetcher: FetchLike = fetch) {
  const payload: { text: string; media?: { media_ids: string[] } } = { text: content };
  if (mediaId) payload.media = { media_ids: [mediaId] };

  const res = await fetcher(`${X_API_BASE}/2/tweets`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(xError("X post creation failed", res.status, data));
  }

  const postId = data?.data?.id;
  if (!postId) throw new Error("X post creation did not return a post id");
  return String(postId);
}

export async function refreshXAccessToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string,
  fetcher: FetchLike = fetch
) {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: clientId,
  });

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetcher(X_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(xError("X token refresh failed", res.status, data));
  }

  if (!data?.access_token) throw new Error("X token refresh did not return an access token");
  return {
    accessToken: String(data.access_token),
    refreshToken: data.refresh_token ? String(data.refresh_token) : refreshToken,
    expiresAt: data.expires_in ? Math.floor(Date.now() / 1000) + Number(data.expires_in) : null,
  };
}
