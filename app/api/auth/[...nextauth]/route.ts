import { NextAuthOptions } from "next-auth";
import NextAuth from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectToDatabase } from "@/helpers/server-helpers";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "jsmith@mail.com",
        },
        password: {
          label: "Password",
          type: "password",
          placeholder: "******",
        },
      },
      async authorize(credentials) {
        const prisma = new PrismaClient();
        if (!credentials || !credentials.email || !credentials.password)
          return null;

        try {
          await connectToDatabase(prisma);

          const user = await prisma.user.findFirst({
            where: { email: credentials.email },
          });

          if (!user?.password) {
            return null;
          }

          const isPasswordCorrect = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (isPasswordCorrect) {
            return user as any;
          }

          return null;
        } catch (error) {
          console.log(error);
          return null;
        } finally {
          await prisma.$disconnect();
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
