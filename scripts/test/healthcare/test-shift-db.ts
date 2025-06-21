/**
 * Simple database test for shift management
 */
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { users } from '../src/db/schema';
import { healthcareUsers } from '../src/db/healthcare-schema';
import { eq } from 'drizzle-orm';

const pool = new Pool({
  connectionString: 'postgresql://myexpo:myexpo123@localhost:5432/myexpo_dev',
});

const db = drizzle(pool);

async function testShiftDB() {

  try {
    // Check for test doctor
    const testEmail = 'doctor.test@example.com';
    
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, testEmail))
      .limit(1);
    
    if (!user) {

      process.exit(1);
    }

    // Check healthcare user
    const [hcUser] = await db
      .select()
      .from(healthcareUsers)
      .where(eq(healthcareUsers.userId, user.id))
      .limit(1);
    
    if (hcUser) {

    } else {

      await db.insert(healthcareUsers).values({
        userId: user.id,
        hospitalId: 'f155b026-01bd-4212-94f3-e7aedef2801d',
        department: 'Emergency',
        specialization: 'Emergency Medicine',
        licenseNumber: 'TEST12345',
        isOnDuty: false,
      });

    }
    
    // List all on-duty staff

    const onDutyStaff = await db
      .select({
        name: users.name,
        role: users.role,
        department: healthcareUsers.department,
        shiftStart: healthcareUsers.shiftStartTime,
      })
      .from(healthcareUsers)
      .innerJoin(users, eq(healthcareUsers.userId, users.id))
      .where(eq(healthcareUsers.isOnDuty, true));
    
    if (onDutyStaff.length === 0) {

    } else {
      onDutyStaff.forEach(staff => {
        const duration = staff.shiftStart 
          ? Math.floor((Date.now() - new Date(staff.shiftStart).getTime()) / 1000 / 60)
          : 0;

      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

testShiftDB();