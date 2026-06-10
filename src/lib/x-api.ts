const X_API_BASE = "https://api.x.com";
const X_MEDIA_BASE = "https://api.x.com";

type FetchLike = typeof fetch;

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

export async function uploadXImage(imageUrl: string, accessToken: string, fetcher: FetchLike = fetch) {
  const parsed = parseImageSource(imageUrl);
  let bytes: Buffer;
  let mimeType = parsed?.mimeType || "image/png";

  if (parsed) {
    bytes = Buffer.from(parsed.base64, "base64");
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
    throw new Error(data?.detail || data?.title || data?.error || "X media upload failed");
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
    throw new Error(data?.detail || data?.title || data?.error || "X post creation failed");
  }

  const postId = data?.data?.id;
  if (!postId) throw new Error("X post creation did not return a post id");
  return String(postId);
}
