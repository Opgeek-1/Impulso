import { NextRequest, NextResponse } from "next/server";
import { join, normalize, extname } from "node:path";
import { readFile } from "node:fs/promises";

const MIME_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const relative = normalize(path.join("/"));
  if (relative.startsWith("..") || relative.includes("..")) {
    return new NextResponse("Not found", { status: 404 });
  }

  const ext = extname(relative).toLowerCase();
  const mime = MIME_TYPES[ext];
  if (!mime) {
    return new NextResponse("Not found", { status: 404 });
  }

  const filePath = join(process.cwd(), "public", "generated", relative);

  try {
    const bytes = await readFile(filePath);
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": mime,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
