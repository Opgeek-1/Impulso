import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dns from "node:dns/promises";
import net from "node:net";

export const dynamic = "force-dynamic";

const MAX_HTML_BYTES = 1_000_000;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { url } = await req.json();
  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  try {
    const target = await validatePublicHttpUrl(url);
    const res = await fetch(target, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Impulso/1.0)" },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch URL" }, { status: 400 });
    }

    const html = await readLimitedText(res);

    // Extract meaningful text content from HTML
    const content = extractTextFromHtml(html, target);

    return NextResponse.json({ content });
  } catch {
    return NextResponse.json({ error: "Failed to fetch URL" }, { status: 400 });
  }
}

async function validatePublicHttpUrl(rawUrl: string): Promise<string> {
  const parsed = new URL(rawUrl);
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Unsupported URL protocol");
  }

  const addresses = await dns.lookup(parsed.hostname, { all: true });
  if (addresses.some((entry) => isPrivateAddress(entry.address))) {
    throw new Error("Private network URLs are not allowed");
  }

  return parsed.toString();
}

function isPrivateAddress(address: string): boolean {
  if (net.isIP(address) === 6) {
    return address === "::1" || address.toLowerCase().startsWith("fc") || address.toLowerCase().startsWith("fd") || address.toLowerCase().startsWith("fe80:");
  }

  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) return true;
  const [a, b] = parts;
  return (
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a === 0
  );
}

async function readLimitedText(res: Response): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return "";

  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > MAX_HTML_BYTES) {
      throw new Error("Response too large");
    }
    chunks.push(value);
  }

  return new TextDecoder().decode(Buffer.concat(chunks));
}

function extractTextFromHtml(html: string, url: string): string {
  // Remove scripts, styles, and HTML tags
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "");

  // Extract meta description
  const metaDesc = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i)?.[1] || "";

  // Extract title
  const title = html.match(/<title[^>]*>(.*?)<\/title>/i)?.[1] || "";

  // Extract og:description
  const ogDesc = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i)?.[1] || "";

  // Strip remaining HTML tags and normalize whitespace
  text = text
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

  // Truncate to reasonable length
  const bodyText = text.slice(0, 3000);

  const parts = [`Source: ${url}`];
  if (title) parts.push(`Title: ${title}`);
  if (metaDesc || ogDesc) parts.push(`Description: ${metaDesc || ogDesc}`);
  parts.push("");
  parts.push(bodyText);

  return parts.join("\n");
}
