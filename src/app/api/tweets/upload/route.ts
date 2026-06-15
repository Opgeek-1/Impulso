import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getWorkspaceMemberIds } from "@/lib/workspace";
import { isSupportedUploadImageType } from "@/lib/image-files";

export const runtime = "nodejs";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const MAX_CHUNK_BYTES = 512 * 1024;

const pendingChunks = new Map<string, { chunks: Map<number, Buffer>; totalChunks: number; fileSize: number; mimeType: string }>();

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Upload form data could not be read." }, { status: 400 });
  }

  const tweetId = formData.get("tweetId");
  const image = formData.get("image");

  if (typeof tweetId !== "string" || !tweetId) {
    return NextResponse.json({ error: "tweetId is required" }, { status: 400 });
  }

  if (!(image instanceof File)) {
    return NextResponse.json({ error: "Image file is required" }, { status: 400 });
  }

  if (!isSupportedUploadImageType(image.type)) {
    return NextResponse.json({ error: "Only PNG, JPEG, WebP, and GIF images are supported." }, { status: 400 });
  }

  const uploadIdValue = formData.get("uploadId");
  const chunkIndexValue = formData.get("chunkIndex");
  const totalChunksValue = formData.get("totalChunks");
  const fileSizeValue = formData.get("fileSize");
  const isChunked =
    typeof uploadIdValue === "string" ||
    typeof chunkIndexValue === "string" ||
    typeof totalChunksValue === "string";

  const memberIds = await getWorkspaceMemberIds(session.user.id);
  const tweet = await prisma.tweet.findFirst({
    where: { id: tweetId },
    include: { project: true },
  });

  if (!tweet || !memberIds.includes(tweet.project.userId)) {
    return NextResponse.json({ error: "Tweet not found" }, { status: 404 });
  }

  try {
    if (isChunked) {
      if (
        typeof uploadIdValue !== "string" ||
        typeof chunkIndexValue !== "string" ||
        typeof totalChunksValue !== "string" ||
        typeof fileSizeValue !== "string"
      ) {
        return NextResponse.json({ error: "Chunked upload metadata is incomplete." }, { status: 400 });
      }

      if (!/^[a-zA-Z0-9_-]+$/.test(uploadIdValue)) {
        return NextResponse.json({ error: "Invalid upload id" }, { status: 400 });
      }

      const chunkIndex = Number(chunkIndexValue);
      const totalChunks = Number(totalChunksValue);
      const fileSize = Number(fileSizeValue);
      if (
        !Number.isInteger(chunkIndex) ||
        !Number.isInteger(totalChunks) ||
        !Number.isInteger(fileSize) ||
        chunkIndex < 0 ||
        totalChunks < 1 ||
        chunkIndex >= totalChunks
      ) {
        return NextResponse.json({ error: "Chunked upload metadata is invalid." }, { status: 400 });
      }

      if (fileSize > MAX_UPLOAD_BYTES) {
        return NextResponse.json({ error: "Image must be under 10 MB." }, { status: 413 });
      }

      if (image.size > MAX_CHUNK_BYTES) {
        return NextResponse.json({ error: "Upload chunk is too large." }, { status: 413 });
      }

      const chunkBuffer = Buffer.from(await image.arrayBuffer());

      if (!pendingChunks.has(uploadIdValue)) {
        pendingChunks.set(uploadIdValue, { chunks: new Map(), totalChunks, fileSize, mimeType: image.type });
      }
      const pending = pendingChunks.get(uploadIdValue)!;
      pending.chunks.set(chunkIndex, chunkBuffer);

      if (chunkIndex < totalChunks - 1) {
        return NextResponse.json({ complete: false });
      }

      pendingChunks.delete(uploadIdValue);
      const parts: Buffer[] = [];
      for (let i = 0; i < totalChunks; i++) {
        const part = pending.chunks.get(i);
        if (!part) {
          return NextResponse.json({ error: "Missing chunk during assembly." }, { status: 400 });
        }
        parts.push(part);
      }
      const bytes = Buffer.concat(parts);
      if (bytes.length !== fileSize) {
        return NextResponse.json({ error: "Uploaded image size did not match the expected size." }, { status: 400 });
      }

      const imageUrl = `data:${pending.mimeType};base64,${bytes.toString("base64")}`;
      const updated = await prisma.tweet.update({
        where: { id: tweet.id },
        data: { imageUrl, status: "IMAGE_GENERATED" },
      });

      return NextResponse.json({ complete: true, tweet: updated });
    }

    if (image.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: "Image must be under 10 MB." }, { status: 413 });
    }

    const bytes = Buffer.from(await image.arrayBuffer());
    const imageUrl = `data:${image.type};base64,${bytes.toString("base64")}`;

    const updated = await prisma.tweet.update({
      where: { id: tweet.id },
      data: { imageUrl, status: "IMAGE_GENERATED" },
    });

    return NextResponse.json({ complete: true, tweet: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Image could not be saved.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
