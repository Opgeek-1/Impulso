import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { chatCompletion, MODELS } from "@/lib/ai";
import { extractJSON } from "@/lib/utils-server";
import { getWorkspaceMemberIds } from "@/lib/workspace";

export const dynamic = "force-dynamic";

function generationErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.error("Tweet generation failed", error);

  if (message.includes("AI_API_BASE_URL and AI_API_KEY")) {
    return NextResponse.json(
      { error: "AI API settings are missing. Add AI_API_BASE_URL and AI_API_KEY, then try again." },
      { status: 503 }
    );
  }

  if (message.startsWith("AI API error:")) {
    return NextResponse.json(
      { error: "The AI provider rejected the generation request. Check your AI API key, model, or provider status." },
      { status: 502 }
    );
  }

  return NextResponse.json(
    { error: "The AI response could not be turned into tweets. Try again with a clearer topic." },
    { status: 502 }
  );
}

function parseGeneratedTweets(raw: string) {
  const parsed = JSON.parse(extractJSON(raw)) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error("AI response was not a tweet array");
  }

  const tweets = parsed
    .map((tweet) => {
      if (!tweet || typeof tweet !== "object") return null;
      const content = (tweet as { content?: unknown }).content;
      return typeof content === "string" && content.trim() ? { content: content.trim() } : null;
    })
    .filter((tweet): tweet is { content: string } => tweet !== null);

  if (tweets.length === 0) {
    throw new Error("AI response did not include tweet content");
  }

  return tweets;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { projectId, topic, tone, count: rawCount = 7, language = "en" } = body;
    const count = Math.min(Math.max(1, Math.floor(Number(rawCount) || 7)), 20);

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
        { role: "user", content: `Topic: ${topic}\n\nReturn exactly a valid JSON array. The first character must be [ and the last character must be ].` },
      ],
    });

    const raw = result.choices[0].message.content;
    let tweetsData: { content: string }[];
    try {
      tweetsData = parseGeneratedTweets(raw);
    } catch {
      const repair = await chatCompletion({
        model: MODELS.tweet,
        temperature: 0,
        messages: [
          {
            role: "system",
            content: "Convert the provided text into a valid JSON array of tweet objects. Only output JSON. Use this shape: [{\"content\":\"tweet text\",\"angle\":\"brief angle\"}].",
          },
          {
            role: "user",
            content: `Topic: ${topic}\nCount: ${count}\nLanguage: ${language}\nInvalid previous output:\n${raw}`,
          },
        ],
      });
      tweetsData = parseGeneratedTweets(repair.choices[0].message.content);
    }

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
  } catch (error) {
    return generationErrorResponse(error);
  }
}
