#!/usr/bin/env node
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq } from "drizzle-orm";
import * as schema from "../src/db/schema.js";

const DEMO_EMAIL = "saipramod273@gmail.com";

async function checkAndFixDemoUser() {
  console.log(`\n🔍 Checking demo user: ${DEMO_EMAIL}`);
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://myexpo:myexpo123@localhost:5432/myexpo_dev',
  });
  
  const db = drizzle(pool, { schema });
  
  try {
    // Check current state
    const [user] = await db
      .select()
      .from(schema.user)
      .where(eq(schema.user.email, DEMO_EMAIL))
      .limit(1);
    
    if (!user) {
      console.log("\n❌ User not found. Creating new user...");
      
      // Create user with proper defaults
      const [newUser] = await db
        .insert(schema.user)
        .values({
          id: crypto.randomUUID(),
          email: DEMO_EMAIL,
          name: "Demo User",
          role: 'guest',
          needsProfileCompletion: true,
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      console.log("\n✅ User created:");
      console.log("  ID:", newUser.id);
      console.log("  Role:", newUser.role);
      console.log("  Needs Profile Completion:", newUser.needsProfileCompletion);
    } else {
      console.log("\n📊 Current user state:");
      console.log("  ID:", user.id);
      console.log("  Email:", user.email);
      console.log("  Role:", user.role);
      console.log("  Needs Profile Completion:", user.needsProfileCompletion);
      console.log("  Organization ID:", user.organizationId);
      console.log("  Default Hospital ID:", user.defaultHospitalId);
      
      // Check if user needs fixing
      if (user.role !== 'guest' || !user.needsProfileCompletion) {
        console.log("\n🔧 Fixing user state...");
        
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
        
        console.log("\n✅ User updated:");
        console.log("  Role:", updatedUser.role);
        console.log("  Needs Profile Completion:", updatedUser.needsProfileCompletion);
      } else {
        console.log("\n✅ User state is correct for OAuth flow");
      }
    }
    
    // Check sessions
    const sessions = await db
      .select()
      .from(schema.session)
      .where(eq(schema.session.userId, user?.id || ''))
      .limit(5);
    
    console.log(`\n📊 Active sessions: ${sessions.length}`);
    for (const session of sessions) {
      const expiresAt = new Date(session.expiresAt);
      const isExpired = expiresAt < new Date();
      console.log(`  - Session ${session.id.substring(0, 8)}... expires at ${expiresAt.toISOString()} ${isExpired ? '(EXPIRED)' : '(ACTIVE)'}`);
    }
    
    // Clean up expired sessions
    const deletedSessions = await db
      .delete(schema.session)
      .where(eq(schema.session.userId, user?.id || ''))
      .returning();
    
    if (deletedSessions.length > 0) {
      console.log(`\n🧹 Cleaned up ${deletedSessions.length} sessions`);
    }
    
  } catch (error) {
    console.error("\n❌ Error:", error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

checkAndFixDemoUser();