#!/usr/bin/env bun
import { db } from '../src/db';
import { user } from '../src/db/schema';
import { eq } from 'drizzle-orm';

async function makeUserOperator() {
  const email = process.argv[2];
  
  if (!email) {
    console.error('Please provide an email address');
    console.log('Usage: bun run scripts/make-user-operator.ts <email>');
    process.exit(1);
  }
  
  try {
    console.log(`Setting user ${email} as operator...`);
    
    const result = await db
      .update(user)
      .set({ role: 'operator' })
      .where(eq(user.email, email))
      .returning();
    
    if (result.length === 0) {
      console.error(`User with email ${email} not found`);
      process.exit(1);
    }
    
    console.log(`✓ Successfully set ${email} as operator`);
    console.log('User details:', {
      id: result[0].id,
      email: result[0].email,
      name: result[0].name,
      role: result[0].role
    });
    
  } catch (error) {
    console.error('Error updating user role:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

makeUserOperator();