import { db } from "@/src/db";
import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import * as schema from "../src/db/schema";

const getTrustedOrigins = () => {
  const origins = [
    // Local development origins
    "http://localhost:8081",
    "http://localhost:3000",
    "http://127.0.0.1:8081",
    "http://127.0.0.1:3000",
  ];

  // Add local network IP for mobile testing
  if (process.env.NODE_ENV === "development") {
    // You can dynamically get your local IP or set it via environment variable
    const localIP = process.env.LOCAL_IP || "192.168.1.104";
    origins.push(
      `http://${localIP}:8081`,
      `http://${localIP}:3000`,
      // Expo development server patterns
      `http://${localIP}:19000`,
      `http://${localIP}:19001`,
      `http://${localIP}:19002`
    );
  }

  // Add production origins from environment variables
  if (process.env.PRODUCTION_URL) {
    origins.push(process.env.PRODUCTION_URL);
  }

  // Add any additional trusted origins from environment
  if (process.env.ADDITIONAL_TRUSTED_ORIGINS) {
    const additionalOrigins = process.env.ADDITIONAL_TRUSTED_ORIGINS.split(",");
    origins.push(...additionalOrigins);
  }

  console.log("[AUTH SERVER] Trusted origins:", origins);
  return origins;
};

export const auth = betterAuth({
  baseURL: (process.env.BETTER_AUTH_BASE_URL || "http://192.168.1.104:8081") + "/api/auth",
  secret:
    process.env.BETTER_AUTH_SECRET || "your-secret-key-change-in-production",
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "doctor",
      },
      hospitalId: {
        type: "string",
        required: false,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Disable for MVP
    sendResetPassword: async ({ user, url }) => {
      // Implement your email sending logic here
      console.log(`Password reset link for ${user.email}: ${url}`);
      // In production, replace with actual email service
    },
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { ...schema },
  }),
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },
  // Cookie configuration
  cookies: {
    sessionToken: {
      name: "better-auth.session-token",
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
  },
  plugins: [expo()], // Added expo plugin here
  // CORS and trusted origins
  trustedOrigins: getTrustedOrigins(),
  
  // Explicit CORS configuration
  cors: {
    origin: getTrustedOrigins(),
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  },
  // trustedOrigins: [
  //   // For local web development
  //   "http://localhost:8081",
  //   "http://localhost:3000",

  //   // Keep your local network IP if testing on other devices
  //   "http://192.168.1.104:8081",

  //   // You can add your production domains here when deploying
  //   // "https://yourapp.com",
  // ],
  // Advanced options
  advanced: {
    crossSubDomainCookies: {
      enabled: process.env.NODE_ENV === "production",
      domain: process.env.COOKIE_DOMAIN, // Set this for production subdomains
    },
    database: {
      generateId: () => {
        // Custom ID generation if needed
        return crypto.randomUUID();
      },
    },
  },
  // Rate limiting (recommended for production)
  rateLimit: {
    window: 15 * 60, // 15 minutes
    max: process.env.NODE_ENV === "production" ? 100 : 1000, // requests per window
    storage: "memory", // Use "redis" in production for distributed systems
  },

  // Logger configuration
  logger: {
    level: process.env.NODE_ENV === "production" ? "error" : "debug",
    disabled: false,
  },
  // Error handling
  onError: (error) => {
    console.error("[AUTH ERROR]", error);
    // You can add error reporting service here (e.g., Sentry)

    // Don't expose internal errors in production
    if (process.env.NODE_ENV === "production") {
      return {
        message: "An error occurred during authentication",
        status: 500,
      };
    }

    return {
      message: error.message,
      status: error.status || 500,
    };
  },
});

// Export type for use in other files
export type Auth = typeof auth;
