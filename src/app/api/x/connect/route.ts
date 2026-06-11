import { NextRequest } from "next/server";
import { signIn } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId") || "";
  const redirectTo = projectId
    ? `/api/x/link-project?projectId=${encodeURIComponent(projectId)}`
    : "/settings?tab=accounts";
  await signIn("twitter", { redirectTo });
}
