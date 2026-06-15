import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

export const GENERATED_IMAGE_PREFIX = "/generated/";

const MIME_EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

const EXTENSION_MIME_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

function generatedDir() {
  return join(process.cwd(), "public", "generated");
}

function generatedFilePath(imageUrl: string) {
  if (!imageUrl.startsWith(GENERATED_IMAGE_PREFIX)) return null;

  const relative = normalize(imageUrl.slice(1));
  if (relative.startsWith("..")) return null;

  return join(process.cwd(), "public", relative);
}

export function imageMimeFromPath(pathOrUrl: string) {
  return EXTENSION_MIME_TYPES[extname(pathOrUrl).toLowerCase()] || "image/png";
}

export function isSupportedUploadImageType(type: string) {
  return type in MIME_EXTENSIONS;
}

export async function saveUploadedImage(file: File, ownerId: string) {
  const extension = MIME_EXTENSIONS[file.type];
  if (!extension) {
    throw new Error("Only PNG, JPEG, WebP, and GIF images are supported.");
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  return saveImageBytes(bytes, file.type, ownerId);
}

export async function saveImageBytes(bytes: Buffer, mimeType: string, ownerId: string) {
  const extension = MIME_EXTENSIONS[mimeType];
  if (!extension) {
    throw new Error("Only PNG, JPEG, WebP, and GIF images are supported.");
  }

  const filename = `${ownerId}-${Date.now()}-${randomUUID()}.${extension}`;
  const dir = generatedDir();
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, filename), bytes);

  return `${GENERATED_IMAGE_PREFIX}${filename}`;
}

export async function readGeneratedImage(imageUrl: string) {
  const filePath = generatedFilePath(imageUrl);
  if (!filePath) return null;

  return {
    bytes: await readFile(filePath),
    mimeType: imageMimeFromPath(filePath),
  };
}

export async function removeGeneratedImage(imageUrl: string | null | undefined) {
  if (!imageUrl) return;

  const filePath = generatedFilePath(imageUrl);
  if (!filePath) return;

  await unlink(filePath).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== "ENOENT") throw error;
  });
}
