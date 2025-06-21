#!/usr/bin/env bun

/**
 * Create test users directly in database with Better Auth hashing
 */

import chalk from 'chalk';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

// Direct imports to avoid React Native issues
const postgres = require('postgres').default || require('postgres');
const { drizzle } = require('drizzle-orm/postgres-js');
const { eq } = require('drizzle-orm');

// Create database connection
const sql = postgres(process.env.DATABASE_URL || 'postgresql://myexpo:myexpo123@localhost:5432/myexpo_dev');
const db = drizzle(sql);

// Import schemas
const { organization, hospitals, users: usersTable, accounts } = require('../src/db/schema');

const API_URL = 'http://localhost:8081';

// Test users to create
const TEST_USERS = [
  {
    email: 'admin@mvp.test',
    password: 'Admin123!@#',
    name: 'MVP Admin',
    role: 'admin',
  },
  {
    email: 'doctor@mvp.test',
    password: 'Doctor123!@#',
    name: 'Dr. MVP Test',
    role: 'doctor',
  },
  {
    email: 'nurse@mvp.test',
    password: 'Nurse123!@#',
    name: 'Nurse MVP',
    role: 'nurse',
  },
  {
    email: 'operator@mvp.test',
    password: 'Operator123!@#',
    name: 'Operator MVP',
    role: 'operator',
  },
  // Also create the existing test users with proper passwords
  {
    email: 'doremon@gmail.com',
    password: 'Test123!@#',  // Better Auth requires 8+ chars
    name: 'Nurse Doremon',
    role: 'nurse',
  },
  {
    email: 'saipramod273@gmail.com',
    password: 'Test123!@#',  // Better Auth requires 8+ chars
    name: 'Dr. Sai Pramod',
    role: 'doctor',
  }
];

async function createUser(userData: typeof TEST_USERS[0]) {
  try {
    // First try to sign up using Better Auth
    const signUpResponse = await fetch(`${API_URL}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: userData.email,
        password: userData.password,
        name: userData.name,
        needsProfileCompletion: false,
        data: {
          role: userData.role,
        }
      }),
    });

    if (!signUpResponse.ok) {
      const errorText = await signUpResponse.text();
      
      // If user already exists, try to sign in to verify it works
      if (errorText.includes('already exists') || signUpResponse.status === 409) {

        const signInResponse = await fetch(`${API_URL}/api/auth/sign-in/email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: userData.email,
            password: userData.password,
          }),
        });
        
        if (signInResponse.ok) {

          return true;
        } else {

          return false;
        }
      }
      
      throw new Error(`Sign up failed: ${errorText}`);
    }

    // Update user role in database if needed
    // Update user role using raw SQL query
    await sql`UPDATE "user" SET role = ${userData.role} WHERE email = ${userData.email}`;
    
    return true;
  } catch (error: any) {

    return false;
  }
}

async function setupHospitalForUsers() {
  try {
    // Get or create organization
    const organizationResult = await sql`SELECT * FROM organization LIMIT 1`;
    let organization = organizationResult[0];
    
    if (!organization) {

      const orgId = crypto.randomUUID();
      const result = await sql`
        INSERT INTO organization (id, name, type, slug, description, created_at, updated_at)
        VALUES (${orgId}, ${'MVP Test Hospital System'}, ${'hospital'}, ${'mvp-test-hospital'}, ${'Test organization for MVP'}, ${new Date()}, ${new Date()})
        RETURNING *
      `;
      organization = result[0];
    }
    
    // Get or create hospital
    const hospitalResult = await sql`
      SELECT * FROM hospitals 
      WHERE organization_id = ${organization.id} 
      LIMIT 1
    `;
    let hospital = hospitalResult[0];
    
    if (!hospital) {

      const hospitalId = crypto.randomUUID();
      const result = await sql`
        INSERT INTO hospitals (id, name, address, phone_number, email, organization_id, created_at, updated_at)
        VALUES (${hospitalId}, ${'MVP Medical Center'}, ${'123 Demo Street, Test City'}, ${'555-0123'}, ${'contact@mvp-medical.test'}, ${organization.id}, ${new Date()}, ${new Date()})
        RETURNING *
      `;
      hospital = result[0];
    }

    // Update healthcare users with hospital assignment
    for (const user of TEST_USERS) {
      if (['nurse', 'doctor', 'operator'].includes(user.role)) {
        await sql`UPDATE "user" SET default_hospital_id = ${hospital.id} WHERE email = ${user.email}`;
      }
    }
    
    return { organization, hospital };
  } catch (error) {
    console.error(chalk.red('Failed to setup hospital:'), error);
    return null;
  }
}

async function main() {

  // Check if server is running
  try {
    const healthCheck = await fetch(`${API_URL}/api/auth/health`);
    if (!healthCheck.ok) {

    }
  } catch (error) {
    console.error(chalk.red('❌ Server not responding. Make sure the app is running on port 8081'));
    process.exit(1);
  }
  
  // Create users
  let successCount = 0;
  for (const userData of TEST_USERS) {
    const success = await createUser(userData);
    if (success) successCount++;
  }
  
  // Setup hospital assignments
  await setupHospitalForUsers();
  
  // Summary

  if (successCount === TEST_USERS.length) {

    TEST_USERS.forEach(user => {

    });

  } else {

  }
}

main().catch(error => {
  console.error(chalk.red('\n❌ Script failed:'), error);
  process.exit(1);
});