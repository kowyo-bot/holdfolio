import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

import { db } from "@/db";
import { env } from "@/lib/env";

const baseURL =
  env.BETTER_AUTH_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

const googleEnabled = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL,
  trustedOrigins: ["http://localhost:3000", baseURL],

  database: drizzleAdapter(db, {
    provider: "pg",
  }),

  emailAndPassword: {
    enabled: true,
  },

  ...(googleEnabled
    ? {
        socialProviders: {
          google: {
            clientId: env.GOOGLE_CLIENT_ID as string,
            clientSecret: env.GOOGLE_CLIENT_SECRET as string,
            prompt: "select_account",
          },
        },
      }
    : {}),

  plugins: [nextCookies()],
});
