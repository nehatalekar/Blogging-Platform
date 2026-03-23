import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { verifyPassword } from "@/lib/auth";
import { getUserByEmailOrUsername } from "@/lib/db";
import prisma from "@/lib/prisma";
import { normalizeImageSrc } from "@/lib/utils";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username or Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const user = await getUserByEmailOrUsername(credentials.username);

        if (!user) {
          return null;
        }

        const isPasswordValid = await verifyPassword(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        if (!user.isVerified) {
          // Throw error to redirect to OTP verification
          throw new Error("User not verified");
        }

        return {
          id: user.id.toString(),
          email: user.email,
          username: user.username,
          name: user.fullName,
          image: normalizeImageSrc(user.profileImage, "") || null,
          isVerified: user.isVerified,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.username = user.username;
        token.id = user.id?.toString();
        token.image = normalizeImageSrc(user.image as string | null | undefined, "") || null;
        token.isVerified = user.isVerified;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.username = token.username as string;
        session.user.id = token.id as string;
        session.user.image = normalizeImageSrc(token.image as string | null | undefined, "") || null;
        session.user.isVerified = (token.isVerified as boolean) || false;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
