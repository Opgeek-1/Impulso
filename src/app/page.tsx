import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { LandingPage } from "@/components/landing-page";
import "./landing/landing.css";

export const metadata: Metadata = {
  title: "Impulso — Your team's content engine for X",
  description:
    "Impulso is the warm, all-in-one workspace where content teams generate, curate, design, and schedule posts for X.",
};

export default async function Home() {
  const session = await auth();
  return <LandingPage isAuthenticated={!!session?.user} />;
}
