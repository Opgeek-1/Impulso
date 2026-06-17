import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LandingPage } from "@/components/landing-page";
import "./landing/landing.css";

export const metadata: Metadata = {
  title: "Impulso — Your team's content engine for X",
  description:
    "Impulso is the warm, all-in-one workspace where content teams generate, curate, design, and schedule posts for X.",
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (session?.user) {
    const params = await searchParams;
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === "string") qs.set(key, value);
    }
    const query = qs.toString();
    redirect(query ? `/dashboard?${query}` : "/dashboard");
  }
  return <LandingPage />;
}
