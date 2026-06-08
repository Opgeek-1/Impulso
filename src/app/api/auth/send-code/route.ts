import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Remove any existing codes for this email
  await prisma.verificationToken.deleteMany({
    where: { identifier: email },
  });

  // Store the new code
  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token: code,
      expires,
    },
  });

  // Create user if they don't exist yet
  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    await prisma.user.create({
      data: { email, name: email.split("@")[0] },
    });
  }

  // Send the code via email
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || "Impulso <onboarding@resend.dev>",
    to: email,
    subject: `${code} is your Impulso verification code`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 400px; margin: 0 auto; padding: 40px 20px;">
        <h2 style="margin: 0 0 8px; font-size: 20px; color: #0f172a;">Your verification code</h2>
        <p style="margin: 0 0 24px; color: #64748b; font-size: 14px;">Enter this code to sign in to Impulso.</p>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
          <span style="font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #0f172a;">${code}</span>
        </div>
        <p style="margin: 0; color: #94a3b8; font-size: 12px;">This code expires in 10 minutes. If you didn't request this, ignore this email.</p>
      </div>
    `,
  });

  if (error) {
    console.error("Failed to send email:", error);
    return NextResponse.json({ error: "Failed to send code" }, { status: 500 });
  }

  console.log(`✉️  Verification code sent to ${email}`);
  return NextResponse.json({ success: true });
}
