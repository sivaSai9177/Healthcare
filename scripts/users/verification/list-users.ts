#!/usr/bin/env bun
import { db } from '@/src/db';
import { users } from '@/src/db/schema';

async function listUsers() {

  try {
    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        defaultHospitalId: users.defaultHospitalId,
        organizationId: users.organizationId,
      })
      .from(users);
    
    if (allUsers.length === 0) {

      return;
    }

    allUsers.forEach((user, index) => {

    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

listUsers();