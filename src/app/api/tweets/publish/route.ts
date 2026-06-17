import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { publishTweet } from "@/lib/x-publish";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Impulso session expired. Refresh and sign in again before publishing." }, { status: 401 });
  }

  const body = await req.json();
  const tweetId = body?.tweetId;
  if (!tweetId) {
    return NextResponse.json({ error: "tweetId is required" }, { status: 400 });
  }

  const result = await publishTweet(tweetId, session.user.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result.tweet);
}
