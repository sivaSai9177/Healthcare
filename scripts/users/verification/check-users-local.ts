#!/usr/bin/env bun

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import 'dotenv/config';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://myexpo:myexpo123@localhost:5432/myexpo_dev';

async function checkUsers() {

  const testEmails = [
    'doremon@gmail.com',
    'johndoe@gmail.com', 
    'johncena@gmail.com',
    'saipramod273@gmail.com'
  ];
  
  try {
    const sql = postgres(DATABASE_URL);
    const db = drizzle(sql);
    
    const result = await sql`
      SELECT id, email, role, name, created_at
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
    
    await sql.end();
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

checkUsers();