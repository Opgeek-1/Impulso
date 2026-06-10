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

  const brief = JSON.parse(extractJSON(tweet.designBrief));
  const basePrompt = tweet.imagePrompt || brief.imagePrompt || brief.concept;
  const brandContext = buildBrandContext(tweet.project);
  const feedbackClause = feedback?.trim()
    ? `\n\nUser feedback on previous image — apply these changes:\n${feedback.trim()}`
    : "";
  const prompt = `${basePrompt}

Brand constraints:
${brandContext}

Do not render any website URL unless it exactly matches the official website URL listed above.${feedbackClause}`;

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

  const updated = await prisma.tweet.update({
    where: { id: tweetId },
    data: {
      imageUrl,
      imagePrompt: prompt,
      status: "IMAGE_GENERATED",
    },
  });

  return NextResponse.json(updated);
}
