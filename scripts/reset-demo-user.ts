#!/usr/bin/env node
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq } from "drizzle-orm";
import * as schema from "../src/db/schema.js";

const DEMO_EMAIL = "saipramod273@gmail.com";

async function resetDemoUser() {
  console.log(`\n🔍 Resetting demo user: ${DEMO_EMAIL}`);
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://myexpo:myexpo123@localhost:5432/myexpo_dev',
  });
  
  const db = drizzle(pool, { schema });
  
  try {
    // Reset user to need profile completion
    const [updatedUser] = await db
      .update(schema.user)
      .set({
        role: 'guest',
        needsProfileCompletion: true,
        organizationId: null,
        defaultHospitalId: null,
        updatedAt: new Date()
      })
      .where(eq(schema.user.email, DEMO_EMAIL))
      .returning();
    
    if (updatedUser) {
      console.log("\n✅ User reset:");
      console.log("  Role:", updatedUser.role);
      console.log("  Needs Profile Completion:", updatedUser.needsProfileCompletion);
      console.log("  Organization ID:", updatedUser.organizationId);
    } else {
      console.log("\n❌ User not found");
    }
    
  } catch (error) {
    console.error("\n❌ Error resetting user:", error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

resetDemoUser();