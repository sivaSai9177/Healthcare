#!/usr/bin/env bun
import { db } from "@/src/db";
import { user as userTable } from "@/src/db/schema";
import { eq } from "drizzle-orm";

const DEMO_EMAIL = "saipramod273@gmail.com";

async function checkDemoUser() {
  console.log(`\n🔍 Checking demo user: ${DEMO_EMAIL}`);
  
  try {
    // Check if user exists
    const [existingUser] = await db
      .select()
      .from(userTable)
      .where(eq(userTable.email, DEMO_EMAIL))
      .limit(1);
    
    if (existingUser) {
      console.log("\n✅ User found:");
      console.log("  ID:", existingUser.id);
      console.log("  Name:", existingUser.name);
      console.log("  Role:", existingUser.role);
      console.log("  Needs Profile Completion:", existingUser.needsProfileCompletion);
      console.log("  Email Verified:", existingUser.emailVerified);
      console.log("  Organization ID:", existingUser.organizationId);
      console.log("  Created At:", existingUser.createdAt);
      
      // Check if user needs fixing
      if (existingUser.role === 'guest' || existingUser.needsProfileCompletion) {
        console.log("\n⚠️  User needs profile completion");
        
        // Optionally fix the user
        const shouldFix = process.argv.includes('--fix');
        if (shouldFix) {
          console.log("\n🔧 Fixing user...");
          const [updatedUser] = await db
            .update(userTable)
            .set({
              role: 'user',
              needsProfileCompletion: false,
              emailVerified: true,
              updatedAt: new Date()
            })
            .where(eq(userTable.id, existingUser.id))
            .returning();
          
          console.log("✅ User fixed:", updatedUser.role, "needsProfileCompletion:", updatedUser.needsProfileCompletion);
        } else {
          console.log("\n💡 To fix this user, run: bun run scripts/check-demo-user.ts --fix");
        }
      } else {
        console.log("\n✅ User is properly configured");
      }
    } else {
      console.log("\n❌ User not found");
      console.log("This user will be created automatically when they sign in with Google OAuth");
    }
    
  } catch (error) {
    console.error("\n❌ Error checking user:", error);
  } finally {
    process.exit(0);
  }
}

checkDemoUser();