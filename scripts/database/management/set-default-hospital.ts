#!/usr/bin/env tsx
import { db } from '@/src/db';
import { hospitals } from '@/src/db/healthcare-schema';
import { eq, and } from 'drizzle-orm';

async function setDefaultHospital() {

  try {
    // Set Dubai Central Hospital as default
    const result = await db
      .update(hospitals)
      .set({ isDefault: true })
      .where(eq(hospitals.id, 'f155b026-01bd-4212-94f3-e7aedef2801d'))
      .returning();

  } catch (error) {
    console.error('❌ Error setting default hospital:', error);
  }
  
  process.exit(0);
}

setDefaultHospital();