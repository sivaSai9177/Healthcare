#!/usr/bin/env bun
import { db } from '@/src/db';
import { users } from '@/src/db/schema';

async function showTestCredentials() {

  try {
    const allUsers = await db
      .select({
        email: users.email,
        role: users.role,
        hospitalId: users.defaultHospitalId,
        organizationId: users.organizationId,
      })
      .from(users)
      .orderBy(users.role, users.email);

    // Group by role
    const usersByRole = allUsers.reduce((acc, user) => {
      if (!acc[user.role]) acc[user.role] = [];
      acc[user.role].push(user);
      return acc;
    }, {} as Record<string, typeof allUsers>);
    
    // Healthcare roles first
    const healthcareRoles = ['nurse', 'doctor', 'operator', 'head_nurse', 'head_doctor'];

    healthcareRoles.forEach(role => {
      if (usersByRole[role]) {
        usersByRole[role].forEach(user => {

          // Show role-specific features
          switch(role) {
            case 'nurse':

              break;
            case 'doctor':

              break;
            case 'operator':

              break;
            case 'head_nurse':
            case 'head_doctor':

              break;
          }
        });
      }
    });

    const adminRoles = ['admin', 'manager'];
    adminRoles.forEach(role => {
      if (usersByRole[role]) {
        usersByRole[role].forEach(user => {

        });
      }
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

showTestCredentials();