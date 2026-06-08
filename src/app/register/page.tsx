import { RegisterForm } from "@/components/register-form";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--imp-bg)" }}>
      <RegisterForm />
    </div>
  );
}
