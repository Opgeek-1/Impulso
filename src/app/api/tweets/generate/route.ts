import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { chatCompletion, MODELS } from "@/lib/ai";
import { extractJSON } from "@/lib/utils-server";
import { getWorkspaceMemberIds } from "@/lib/workspace";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { projectId, topic, tone, count = 7, language = "en" } = body;

  if (!projectId || !topic) {
    return NextResponse.json({ error: "projectId and topic are required" }, { status: 400 });
  }

  const memberIds = await getWorkspaceMemberIds(session.user.id);

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: { in: memberIds } },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const briefSection = project.brief
    ? `\n\nACCOUNT CONTEXT — Use this as background reference for content generation:\n${project.brief}\n`
    : "";

  const systemPrompt = `You are a social media content strategist. Generate ${count} unique tweets for the Twitter account @${project.handle} (${project.name}).
${briefSection}
Each tweet should:
- Be under 280 characters
- Approach the topic from a different angle
- Be engaging and shareable
- Match the tone: ${tone || "professional yet approachable"}
- Write in ${language === "en" ? "English" : language === "zh" ? "Chinese" : language === "ja" ? "Japanese" : language === "es" ? "Spanish" : language}

Respond with a JSON array of objects: [{"content": "tweet text", "angle": "brief description of the angle"}]
Only output the JSON array, nothing else.`;

  const result = await chatCompletion({
    model: MODELS.tweet,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Topic: ${topic}` },
    ],
  });

  const tweetsData = JSON.parse(extractJSON(result.choices[0].message.content));

  const batch = await prisma.batch.create({
    data: { name: `${topic} - ${new Date().toLocaleDateString()}` },
  });

  const tweets = await Promise.all(
    tweetsData.map((t: { content: string }) =>
      prisma.tweet.create({
        data: {
          content: t.content,
          projectId,
          batchId: batch.id,
          status: "DRAFT",
        },
      })
    )
  );

  return NextResponse.json({ batch, tweets });
}
