interface BrandContextProject {
  name: string;
  handle: string;
  brief?: string | null;
  brandLogoUrl?: string | null;
  brandColors?: string | null;
  brandAssetsNote?: string | null;
}

function extractUrls(text: string): string[] {
  const urls = new Set<string>();
  const sourceMatches = text.matchAll(/^Source:\s*(\S+)/gim);
  for (const match of sourceMatches) urls.add(match[1]);

  const urlMatches = text.matchAll(/\bhttps?:\/\/[^\s)]+|\bwww\.[^\s)]+/gi);
  for (const match of urlMatches) urls.add(match[0]);

  const domainMatches = text.matchAll(/\b(?![\w.-]+@)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+(?:\/[^\s)]*)?)/gi);
  for (const match of domainMatches) urls.add(match[1]);

  return Array.from(urls);
}

export function buildBrandContext(project: BrandContextProject): string {
  const sections = [
    `Account: @${project.handle} (${project.name})`,
  ];

  const brief = project.brief?.trim();
  const officialUrls = brief ? extractUrls(brief) : [];
  if (officialUrls.length > 0) {
    sections.push(`Official website URL(s): ${officialUrls.join(", ")}`);
  }

  if (brief) {
    sections.push(`Account brief:\n${brief}`);
  }

  if (project.brandColors?.trim()) {
    sections.push(`Brand colors:\n${project.brandColors.trim()}`);
  }

  if (project.brandLogoUrl) {
    sections.push("Logo asset: A reference image of the brand logo is attached. Paste the logo EXACTLY as provided — same shape, icon, colors, background, proportions, and text. Do NOT redraw, reinterpret, simplify, or stylize it. Treat it as a fixed graphic asset, not a prompt to generate a similar logo.");
  }

  if (project.brandAssetsNote?.trim()) {
    sections.push(`Brand asset notes:\n${project.brandAssetsNote.trim()}`);
  }

  sections.push("Website rule: if a website URL appears in the generated image or prompt, it must exactly match one of the official website URL(s) above. If no official website URL is listed, omit website text instead of inventing one.");

  return sections.join("\n\n");
}
