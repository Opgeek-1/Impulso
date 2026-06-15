import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import Credentials from "next-auth/providers/credentials";
import Twitter from "next-auth/providers/twitter";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { getWorkspaceMemberIds } from "@/lib/workspace";

type XProfile = {
  data?: { id?: string; name?: string; username?: string; profile_image_url?: string; email?: string | null };
  detail?: string;
  title?: string;
  error?: string;
};

type XUserinfoRequest = { tokens: { access_token?: string } };

function readXProfile(profile: unknown) {
  const xProfile = profile as XProfile;
  const data = xProfile?.data;
  return {
    id: data?.id,
    name: data?.name,
    username: data?.username,
    image: data?.profile_image_url,
    email: data?.email ?? null,
  };
}

const providers: Provider[] = [
  Credentials({
    id: "credentials",
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) return null;

      const email = String(credentials.email).trim().toLowerCase();
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user || !user.password) return null;

      const bcrypt = await import("bcryptjs");
      const isValid = await bcrypt.compare(
        credentials.password as string,
        user.password
      );

      if (!isValid) return null;

      return { id: user.id, email: user.email, name: user.name };
    },
  }),
  Credentials({
    id: "email-code",
    name: "email-code",
    credentials: {
      email: { label: "Email", type: "email" },
      code: { label: "Code", type: "text" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.code) return null;

      const email = String(credentials.email).trim().toLowerCase();
      const code = credentials.code as string;

      const token = await prisma.verificationToken.findFirst({
        where: { identifier: email, token: code },
      });

      if (!token || token.expires < new Date()) return null;

      // Clean up the token
      await prisma.verificationToken.delete({
        where: { identifier_token: { identifier: email, token: code } },
      });

      // Find or create user
      let user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        user = await prisma.user.create({
          data: { email, name: email.split("@")[0], emailVerified: new Date() },
        });
      } else {
        await prisma.user.update({
          where: { email },
          data: { emailVerified: new Date() },
        });
      }

      return { id: user.id, email: user.email, name: user.name };
    },
  }),
];

if (process.env.AUTH_TWITTER_ID && process.env.AUTH_TWITTER_SECRET) {
  providers.push(
    Twitter({
      clientId: process.env.AUTH_TWITTER_ID,
      clientSecret: process.env.AUTH_TWITTER_SECRET,
      authorization: {
        url: "https://x.com/i/oauth2/authorize",
        params: { scope: "tweet.read tweet.write users.read media.write offline.access" },
      },
      userinfo: {
        async request({ tokens }: XUserinfoRequest) {
          const res = await fetch("https://api.x.com/2/users/me?user.fields=profile_image_url", {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
          });
          const profile = await res.json().catch(() => null) as XProfile | null;
          if (!res.ok || !profile?.data?.id) {
            throw new Error(profile?.detail || profile?.title || profile?.error || "X profile request failed");
          }
          return profile;
        },
      },
      profile(profile) {
        const xProfile = readXProfile(profile);
        if (!xProfile.id) throw new Error("X profile response did not include a user id");
        return {
          id: xProfile.id,
          name: xProfile.name || xProfile.username || "X user",
          email: xProfile.email,
          image: xProfile.image,
        };
      },
    })
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  trustHost: true,
  providers,
  callbacks: {
    async signIn({ account, profile, user }) {
      if (account?.provider === "twitter" && user?.id) {
        const cookieStore = await cookies();
        const projectId = cookieStore.get("impulso_x_project_id")?.value;
        const connectingUserId = cookieStore.get("impulso_x_user_id")?.value;
        if (projectId && connectingUserId) {
          const xProfile = readXProfile(profile);
          const memberIds = await getWorkspaceMemberIds(connectingUserId);
          await prisma.project.updateMany({
            where: { id: projectId, userId: { in: memberIds } },
            data: {
              xProviderAccountId: account.providerAccountId,
              xUsername: xProfile.username || null,
            },
          });
          cookieStore.delete("impulso_x_project_id");
          cookieStore.delete("impulso_x_user_id");
        }
      }
      return true;
    },
    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
