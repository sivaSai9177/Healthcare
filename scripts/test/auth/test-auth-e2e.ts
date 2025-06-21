#!/usr/bin/env bun

import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "../src/db/schema";
import * as combinedSchema from "../src/db/combined-schema";

// Test user credentials
const TEST_USER = {
  email: "test@example.com",
  password: "testpassword123",
  name: "Test User"
};

// Database setup
const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema: { ...schema, ...combinedSchema } });

async function testAuth() {
// TODO: Replace with structured logging - /* console.log("🧪 Starting E2E Authentication Test...\n") */;

  try {
    // 1. Test Registration
// TODO: Replace with structured logging - /* console.log("1️⃣ Testing Registration...") */;
    const registerResponse = await fetch("http://localhost:8081/api/auth/sign-up", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: TEST_USER.email,
        password: TEST_USER.password,
        name: TEST_USER.name,
      }),
    });

    if (!registerResponse.ok) {
      const error = await registerResponse.text();
      console.error("❌ Registration failed:", error);
      
      // Try login if user already exists
// TODO: Replace with structured logging - /* console.log("   Attempting login with existing user...") */;
    } else {
      const registerData = await registerResponse.json();
      // TODO: Replace with structured logging

    }

    // 2. Test Login
// TODO: Replace with structured logging - /* console.log("\n2️⃣ Testing Login...") */;
    const loginResponse = await fetch("http://localhost:8081/api/auth/sign-in", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: TEST_USER.email,
        password: TEST_USER.password,
      }),
    });

    if (!loginResponse.ok) {
      const error = await loginResponse.text();
      console.error("❌ Login failed:", error);
      return;
    }

    const loginData = await loginResponse.json();
    const sessionToken = loginResponse.headers.get("set-cookie")?.match(/better-auth.session_token=([^;]+)/)?.[1];
    
    // TODO: Replace with structured logging

    // 3. Test Session
// TODO: Replace with structured logging - /* console.log("\n3️⃣ Testing Session...") */;
    const sessionResponse = await fetch("http://localhost:8081/api/auth/get-session", {
      headers: {
        "Cookie": `better-auth.session_token=${sessionToken}`,
      },
    });

    if (!sessionResponse.ok) {
      console.error("❌ Session fetch failed");
      return;
    }

    const sessionData = await sessionResponse.json();
    // TODO: Replace with structured logging

    // 4. Test Profile Completion
// TODO: Replace with structured logging - /* console.log("\n4️⃣ Testing Profile Completion...") */;
    const profileResponse = await fetch("http://localhost:8081/api/auth/update-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": `better-auth.session_token=${sessionToken}`,
      },
      body: JSON.stringify({
        role: "user",
        organizationRole: "doctor",
        department: "Emergency",
        phoneNumber: "+1234567890",
      }),
    });

    if (!profileResponse.ok) {
      console.error("❌ Profile update failed");
      return;
    }

// TODO: Replace with structured logging - /* console.log("✅ Profile completed successfully") */;

    // 5. Test Logout
// TODO: Replace with structured logging - /* console.log("\n5️⃣ Testing Logout...") */;
    const logoutResponse = await fetch("http://localhost:8081/api/auth/sign-out", {
      method: "POST",
      headers: {
        "Cookie": `better-auth.session_token=${sessionToken}`,
      },
    });

    if (!logoutResponse.ok) {
      console.error("❌ Logout failed");
      return;
    }

// TODO: Replace with structured logging - /* console.log("✅ Logout successful") */;

    // 6. Verify session is invalidated
// TODO: Replace with structured logging - /* console.log("\n6️⃣ Verifying session invalidated...") */;
    const invalidSessionResponse = await fetch("http://localhost:8081/api/auth/get-session", {
      headers: {
        "Cookie": `better-auth.session_token=${sessionToken}`,
      },
    });

    const invalidSessionData = await invalidSessionResponse.json();
    if (!invalidSessionData.user) {
// TODO: Replace with structured logging - /* console.log("✅ Session properly invalidated") */;
    } else {
      console.error("❌ Session still active after logout");
    }

// TODO: Replace with structured logging - /* console.log("\n🎉 E2E Authentication Test Complete!") */;
    
  } catch (error) {
    console.error("\n❌ Test failed with error:", error);
  } finally {
    process.exit(0);
  }
}

// Run the test
testAuth();