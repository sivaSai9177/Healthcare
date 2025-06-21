#!/usr/bin/env bun

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';

// Load env
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function checkUsers() {

  const testEmails = [
    'doremon@gmail.com',
    'johndoe@gmail.com', 
    'johncena@gmail.com',
    'saipramod273@gmail.com'
  ];
  
  try {
    const result = await sql`
      SELECT id, email, role, name, "defaultHospitalId", "organizationId", "createdAt"
      FROM "user"
      WHERE email = ANY(${testEmails})
      ORDER BY email
    `;

    result.forEach((user: any) => {

    });
    
    // Check if any are missing
    const foundEmails = result.map((u: any) => u.email);
    const missingEmails = testEmails.filter(email => !foundEmails.includes(email));
    
    if (missingEmails.length > 0) {

      missingEmails.forEach(email => {});

    } else {

    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

checkUsers();