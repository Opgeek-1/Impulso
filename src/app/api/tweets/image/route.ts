import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateImage, MODELS } from "@/lib/ai";
import { extractJSON } from "@/lib/utils-server";
import { writeFile } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { tweetId } = body;

  if (!tweetId) {
    return NextResponse.json({ error: "tweetId is required" }, { status: 400 });
  }

  const tweet = await prisma.tweet.findFirst({
    where: { id: tweetId },
    include: { project: { include: { user: true } } },
  });

  if (!tweet || tweet.project.userId !== session.user.id) {
    return NextResponse.json({ error: "Tweet not found" }, { status: 404 });
  }

  if (!tweet.designBrief) {
    return NextResponse.json({ error: "Design brief not generated yet" }, { status: 400 });
  }

  const brief = JSON.parse(extractJSON(tweet.designBrief));
  const prompt = brief.imagePrompt || brief.concept;

  const result = await generateImage(prompt, {
    model: MODELS.image,
    size: "1792x1024",
  });

  let imageUrl: string;
  const b64 = result.data[0]?.b64_json;
  const url = result.data[0]?.url;

  if (b64) {
    const filename = `${tweetId}-${Date.now()}.png`;
    const filePath = path.join(process.cwd(), "public", "generated", filename);
    await writeFile(filePath, Buffer.from(b64, "base64"));
    imageUrl = `/generated/${filename}`;
  } else {
    imageUrl = url;
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
