import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { chatCompletion, MODELS } from "@/lib/ai";
import { extractJSON } from "@/lib/utils-server";
import { getWorkspaceMemberIds } from "@/lib/workspace";
import { buildBrandContext } from "@/lib/brand-context";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { tweetId, styleId } = body;
  const hasStyleId = Object.hasOwn(body, "styleId");

  if (!tweetId) {
    return NextResponse.json({ error: "tweetId is required" }, { status: 400 });
  }

  const memberIds = await getWorkspaceMemberIds(session.user.id);

  const tweet = await prisma.tweet.findFirst({
    where: { id: tweetId },
    include: { project: { include: { user: true, styles: true } } },
  });

  if (!tweet || !memberIds.includes(tweet.project.userId)) {
    return NextResponse.json({ error: "Tweet not found" }, { status: 404 });
  }

  let styleGuide = "";
  if (styleId) {
    const style = tweet.project.styles.find((s) => s.id === styleId);
    if (!style) {
      return NextResponse.json({ error: "Style not found" }, { status: 400 });
    }
    styleGuide = style.content;
  } else if (!hasStyleId) {
    const defaultStyle = tweet.project.styles.find((s) => s.isDefault);
    if (defaultStyle) styleGuide = defaultStyle.content;
  }

  const styleSection = styleGuide
    ? `\n\nIMPORTANT — Follow this brand style guide strictly:\n${styleGuide}\n`
    : "";
  const brandContext = buildBrandContext(tweet.project);

  const systemPrompt = `You are a graphic designer specializing in social media visuals. Given a tweet, create a detailed design brief for an accompanying image/poster.
IMPORTANT — Follow this account brand context strictly:
${brandContext}
${styleSection}
The design brief should include:
- Visual concept and composition
- Color palette (specific hex codes)
- Typography suggestions
- Key visual elements and their placement
- Overall mood and style
- Dimensions based on style guide, or default 1200x675px (Twitter card)
- Any visible website URL must match the official website exactly; never invent or substitute a different website.

CRITICAL rules for the imagePrompt:
- MINIMIZE text in the image. Prefer icons, diagrams, and visual metaphors over written words.
- Any text that MUST appear should be listed word-for-word in the prompt so the image model spells it correctly.
- If a brand logo is available, the prompt must instruct the model to copy the attached reference image exactly — same shape, colors, proportions, and any text within the logo. Never describe the logo in words; reference the attached image.
- Specify clear, uncluttered compositions — AI image models render text more accurately when there's less of it.

Output a JSON object with:
{
  "concept": "brief description",
  "composition": "detailed layout description",
  "colorPalette": ["#hex1", "#hex2", ...],
  "typography": "font and text styling details",
  "elements": ["element1", "element2", ...],
  "mood": "overall mood description",
  "imagePrompt": "an image generation prompt that faithfully follows the style guide and rules above"
}

Only output the JSON, nothing else.`;

  const result = await chatCompletion({
    model: MODELS.design,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Tweet: "${tweet.content}"\nAccount: @${tweet.project.handle} (${tweet.project.name})` },
    ],
  });

  const raw = result.choices[0].message.content;
  const designBrief = extractJSON(raw);

  const updated = await prisma.tweet.update({
    where: { id: tweetId },
    data: {
      designBrief,
      status: "DESIGNED",
    },
  });

  return NextResponse.json(updated);
}
