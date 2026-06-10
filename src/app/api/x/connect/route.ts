import { signIn } from "@/lib/auth";

export async function GET() {
  await signIn("twitter", { redirectTo: "/settings?tab=accounts" });
}
