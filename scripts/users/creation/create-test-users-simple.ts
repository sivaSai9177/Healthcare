import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import 'dotenv/config';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://myexpo:myexpo123@localhost:5432/myexpo_dev';

async function createTestUsers() {

  const sql = postgres(DATABASE_URL);
  const db = drizzle(sql);
  
  const testUsers = [
    { email: 'johndoe@gmail.com', name: 'John Doe', role: 'doctor' },
    { email: 'doremon@gmail.com', name: 'Doremon', role: 'nurse' },
    { email: 'johncena@gmail.com', name: 'John Cena', role: 'operator' },
    { email: 'saipramod273@gmail.com', name: 'Sai Pramod', role: 'head_doctor' },
  ];
  
  const password = 'test123';
  const hashedPassword = await bcrypt.hash(password, 10);
  
  for (const user of testUsers) {
    try {
      // Check if user exists
      const existing = await sql`
        SELECT id FROM "user" WHERE email = ${user.email}
      `;
      
      if (existing.length > 0) {

        continue;
      }
      
      // Create user
      const result = await sql`
        INSERT INTO "user" (id, email, name, role, email_verified, created_at, updated_at)
        VALUES (
          gen_random_uuid(),
          ${user.email},
          ${user.name},
          ${user.role},
          true,
          NOW(),
          NOW()
        )
        RETURNING id
      `;
      
      // Create account for password auth
      await sql`
        INSERT INTO account (id, "userId", "accountId", "providerId", "createdAt", "updatedAt", password)
        VALUES (
          gen_random_uuid(),
          ${result[0].id},
          ${user.email},
          'credential',
          NOW(),
          NOW(),
          ${hashedPassword}
        )
      `;

    } catch (error) {
      console.error(`❌ Failed to create ${user.email}:`, error);
    }
  }
  
  await sql.end();

}

createTestUsers().catch(console.error);
