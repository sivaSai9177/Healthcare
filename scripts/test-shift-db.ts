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
  console.log('🏥 Testing Shift Management Database...\n');
  
  try {
    // Check for test doctor
    const testEmail = 'doctor.test@example.com';
    
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, testEmail))
      .limit(1);
    
    if (!user) {
      console.log('❌ Test doctor not found. Please create user first.');
      console.log('   Email:', testEmail);
      console.log('   Password: test123456');
      process.exit(1);
    }
    
    console.log('✅ Found test user:', user.name);
    console.log('   Role:', user.role);
    console.log('   ID:', user.id);
    
    // Check healthcare user
    const [hcUser] = await db
      .select()
      .from(healthcareUsers)
      .where(eq(healthcareUsers.userId, user.id))
      .limit(1);
    
    if (hcUser) {
      console.log('\n📊 Healthcare Profile:');
      console.log('   Department:', hcUser.department);
      console.log('   On Duty:', hcUser.isOnDuty);
      console.log('   Shift Start:', hcUser.shiftStartTime);
      console.log('   Shift End:', hcUser.shiftEndTime);
    } else {
      console.log('\n❌ No healthcare profile found. Creating...');
      
      await db.insert(healthcareUsers).values({
        userId: user.id,
        hospitalId: 'f155b026-01bd-4212-94f3-e7aedef2801d',
        department: 'Emergency',
        specialization: 'Emergency Medicine',
        licenseNumber: 'TEST12345',
        isOnDuty: false,
      });
      
      console.log('✅ Created healthcare profile');
    }
    
    // List all on-duty staff
    console.log('\n👥 Current On-Duty Staff:');
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
      console.log('   No staff currently on duty');
    } else {
      onDutyStaff.forEach(staff => {
        const duration = staff.shiftStart 
          ? Math.floor((Date.now() - new Date(staff.shiftStart).getTime()) / 1000 / 60)
          : 0;
        console.log(`   - ${staff.name} (${staff.role}) - ${staff.department} - ${duration}min`);
      });
    }
    
    console.log('\n✅ Database test complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

testShiftDB();