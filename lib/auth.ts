import { db } from "@/src/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import * as schema from "../src/db/schema";

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { ...schema },
  }),
  trustedOrigins: [
    "expostarter://",
    "http://localhost:3000",
    "http://localhost:8081", // Add this lin
    "http://192.168.1.104:8081",
    "exp://djo_owc-anonymous-8081.exp.direct",
    "exp://192.168.1.104:8081",
  ],
});
