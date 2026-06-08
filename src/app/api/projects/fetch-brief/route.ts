import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

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
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Impulso/1.0)" },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch URL" }, { status: 400 });
    }

    const html = await res.text();

    // Extract meaningful text content from HTML
    const content = extractTextFromHtml(html, url);

    return NextResponse.json({ content });
  } catch {
    return NextResponse.json({ error: "Failed to fetch URL" }, { status: 400 });
  }
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
