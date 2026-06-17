import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateImage, MODELS } from "@/lib/ai";
import { extractJSON } from "@/lib/utils-server";
import { getWorkspaceMemberIds } from "@/lib/workspace";
import { buildBrandContext } from "@/lib/brand-context";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { tweetId, model, feedback } = body;

  if (!tweetId) {
    return NextResponse.json({ error: "tweetId is required" }, { status: 400 });
  }

  const memberIds = await getWorkspaceMemberIds(session.user.id);

  const tweet = await prisma.tweet.findFirst({
    where: { id: tweetId },
    include: { project: { include: { user: true } } },
  });

  if (!tweet || !memberIds.includes(tweet.project.userId)) {
    return NextResponse.json({ error: "Tweet not found" }, { status: 404 });
  }

  if (!tweet.designBrief) {
    return NextResponse.json({ error: "Design brief not generated yet" }, { status: 400 });
  }

  let brief;
  try {
    brief = JSON.parse(extractJSON(tweet.designBrief));
  } catch {
    return NextResponse.json(
      { error: "Design brief contains invalid JSON. Please regenerate the design brief." },
      { status: 400 }
    );
  }
  const basePrompt = tweet.imagePrompt || brief.imagePrompt || brief.concept;
  const brandContext = buildBrandContext(tweet.project);
  const feedbackClause = feedback?.trim()
    ? `\n\nUser feedback on previous image — apply these changes:\n${feedback.trim()}`
    : "";
  const hasLogo = !!tweet.project.brandLogoUrl;
  const logoInstructions = hasLogo
    ? `\n\nCRITICAL — Logo reproduction:
The attached reference image is the brand's official logo. You MUST:
1. Copy the logo EXACTLY as it appears in the reference — same shape, icon, colors, background, and proportions.
2. Do NOT redraw, reinterpret, simplify, add effects to, or stylize the logo in any way.
3. Place the logo in the bottom-left corner of the composition with clear spacing around it.
4. The logo must be clearly visible and not obscured by other elements.
5. Treat the logo as a fixed asset — paste it as-is, do not regenerate it.`
    : "";
  const prompt = `${basePrompt}

Brand constraints:
${brandContext}

Typography rules:
- Every word and letter in the image must be spelled correctly and rendered clearly.
- Use simple, bold sans-serif fonts for readability.
- Minimize the amount of text — prefer icons, symbols, and visual elements over written words.
- Double-check that all text is legible, properly spaced, and not cut off.
- Do not render any website URL unless it exactly matches the official website URL listed above.${logoInstructions}${feedbackClause}`;

  let result;
  try {
    const imageModel = model || MODELS.image;
    result = await generateImage(prompt, {
      model: imageModel,
      size: "1536x1024",
      referenceImageDataUrl: tweet.project.brandLogoUrl,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Image generation failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  let imageUrl: string;
  const b64 = result.data[0]?.b64_json;
  const url = result.data[0]?.url;

  if (url) {
    imageUrl = url;
  } else if (b64) {
    imageUrl = b64;
  } else {
    return NextResponse.json({ error: "No image generated" }, { status: 500 });
  }

  const allowedForImageStatus = ["DRAFT", "CURATED", "DESIGNED", "IMAGE_GENERATED"];
  const updated = await prisma.tweet.update({
    where: { id: tweetId },
    data: {
      imageUrl,
      imagePrompt: prompt,
      ...(allowedForImageStatus.includes(tweet.status) && { status: "IMAGE_GENERATED" }),
    },
  });

  return NextResponse.json(updated);
}
