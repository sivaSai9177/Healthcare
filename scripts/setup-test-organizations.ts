import * as dotenv from 'dotenv';
import * as path from 'path';
import { nanoid } from 'nanoid';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { organization, organizationCode, organizationMember, organizationSettings } from '../src/db/organization-schema';
import { hospitals } from '../src/db/healthcare-schema';
import { user } from '../src/db/schema';
import { eq } from 'drizzle-orm';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// Direct database connection
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
if (!connectionString) {
  console.error('❌ No database connection string found in environment variables');
  process.exit(1);
}

const sql = postgres(connectionString);
const db = drizzle(sql);

// Helper to generate organization codes
const generateOrgCode = (orgName: string): string => {
  const prefix = orgName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 4)
    .padEnd(4, 'X');
  const suffix = nanoid(6).toUpperCase();
  return `${prefix}-${suffix}`;
};

async function setupTestOrganizations() {
  try {
    console.log('\n🚀 Setting up test organizations...\n');

    // 1. Create test organizations
    const testOrgs = [
      {
        name: 'City Medical Center',
        type: 'healthcare',
        size: 'large',
        description: 'Main city hospital network',
        hospitals: [
          { name: 'Downtown Medical Center', code: 'DMC-001', isDefault: true },
          { name: 'Northside Clinic', code: 'NSC-001', isDefault: false },
          { name: 'Emergency Care Unit', code: 'ECU-001', isDefault: false }
        ]
      },
      {
        name: 'Regional Health Network',
        type: 'healthcare',
        size: 'enterprise',
        description: 'Regional healthcare provider',
        hospitals: [
          { name: 'Regional General Hospital', code: 'RGH-001', isDefault: true },
          { name: 'Pediatric Center', code: 'PED-001', isDefault: false }
        ]
      },
      {
        name: 'Emergency Services Corp',
        type: 'healthcare',
        size: 'medium',
        description: 'Emergency dispatch and response',
        hospitals: [
          { name: 'Central Dispatch', code: 'CDP-001', isDefault: true }
        ]
      },
      {
        name: 'Tech Innovations Inc',
        type: 'business',
        size: 'medium',
        description: 'Technology company (non-healthcare)',
        hospitals: []
      }
    ];

    // Find or create an admin user
    const adminUsers = await db
      .select()
      .from(user)
      .where(eq(user.role, 'admin'))
      .limit(1);

    let adminUserId: string;
    if (adminUsers.length === 0) {
      console.log('⚠️  No admin user found. Creating one...');
      const [newAdmin] = await db
        .insert(user)
        .values({
          email: 'admin@hospital-system.com',
          name: 'System Admin',
          role: 'admin',
          emailVerified: true,
        })
        .returning();
      adminUserId = newAdmin.id;
      console.log('✅ Created admin user: admin@hospital-system.com');
    } else {
      adminUserId = adminUsers[0].id;
      console.log(`✅ Using existing admin: ${adminUsers[0].email}`);
    }

    // Create organizations
    for (const orgData of testOrgs) {
      console.log(`\n📍 Creating organization: ${orgData.name}`);

      // Check if organization already exists
      const existing = await db
        .select()
        .from(organization)
        .where(eq(organization.name, orgData.name))
        .limit(1);

      if (existing.length > 0) {
        console.log(`   ⚠️  Organization already exists, skipping...`);
        continue;
      }

      // Create organization
      const [newOrg] = await db
        .insert(organization)
        .values({
          name: orgData.name,
          slug: orgData.name.toLowerCase().replace(/\s+/g, '-'),
          type: orgData.type,
          size: orgData.size,
          description: orgData.description,
          status: 'active',
          createdBy: adminUserId,
          timezone: 'America/New_York',
          language: 'en',
          currency: 'USD'
        })
        .returning();

      console.log(`   ✅ Created organization: ${newOrg.id}`);

      // Add admin as owner
      await db.insert(organizationMember).values({
        organizationId: newOrg.id,
        userId: adminUserId,
        role: 'owner',
        status: 'active'
      });

      // Create organization settings
      await db.insert(organizationSettings).values({
        organizationId: newOrg.id,
      });

      // Create hospitals for healthcare organizations
      if (orgData.type === 'healthcare' && orgData.hospitals.length > 0) {
        console.log(`   🏥 Creating ${orgData.hospitals.length} hospitals...`);
        
        for (const hospitalData of orgData.hospitals) {
          const [newHospital] = await db
            .insert(hospitals)
            .values({
              organizationId: newOrg.id,
              name: hospitalData.name,
              code: hospitalData.code,
              isDefault: hospitalData.isDefault,
              isActive: true,
              settings: {
                departments: ['emergency', 'icu', 'surgery', 'pediatrics'],
                alertTypes: ['code_blue', 'medical_emergency', 'security', 'fire']
              }
            })
            .returning();

          console.log(`      ✅ ${hospitalData.name} (${hospitalData.code})${hospitalData.isDefault ? ' [DEFAULT]' : ''}`);
        }
      }

      // Generate organization codes
      console.log(`   🔑 Generating access codes...`);

      // General member code (unlimited uses, no expiration)
      const memberCode = generateOrgCode(orgData.name);
      await db.insert(organizationCode).values({
        organizationId: newOrg.id,
        code: memberCode,
        type: 'member',
        maxUses: null, // unlimited
        currentUses: 0,
        isActive: true,
        createdBy: adminUserId
      });
      console.log(`      ✅ Member code: ${memberCode} (unlimited uses)`);

      // Admin code (limited uses, 30 days expiration)
      const adminCode = generateOrgCode(orgData.name + 'ADM');
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      await db.insert(organizationCode).values({
        organizationId: newOrg.id,
        code: adminCode,
        type: 'admin',
        maxUses: 5,
        currentUses: 0,
        expiresAt: thirtyDaysFromNow,
        isActive: true,
        createdBy: adminUserId
      });
      console.log(`      ✅ Admin code: ${adminCode} (5 uses, expires in 30 days)`);

      // Temporary code for testing (10 uses, 7 days)
      const tempCode = generateOrgCode(orgData.name + 'TMP');
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

      await db.insert(organizationCode).values({
        organizationId: newOrg.id,
        code: tempCode,
        type: 'member',
        maxUses: 10,
        currentUses: 0,
        expiresAt: sevenDaysFromNow,
        isActive: true,
        createdBy: adminUserId
      });
      console.log(`      ✅ Temp code: ${tempCode} (10 uses, expires in 7 days)`);
    }

    // 2. Create sample healthcare users with roles
    console.log('\n👥 Creating sample healthcare users...\n');

    const sampleUsers = [
      { email: 'doctor1@hospital.com', name: 'Dr. Smith', role: 'doctor' },
      { email: 'nurse1@hospital.com', name: 'Nurse Johnson', role: 'nurse' },
      { email: 'operator1@hospital.com', name: 'Op. Williams', role: 'operator' },
      { email: 'headdoc1@hospital.com', name: 'Dr. Chief Brown', role: 'head_doctor' },
      { email: 'manager1@hospital.com', name: 'Manager Davis', role: 'manager' },
      { email: 'user1@example.com', name: 'Regular User', role: 'user' }
    ];

    for (const userData of sampleUsers) {
      const existing = await db
        .select()
        .from(user)
        .where(eq(user.email, userData.email))
        .limit(1);

      if (existing.length === 0) {
        const [newUser] = await db
          .insert(user)
          .values({
            email: userData.email,
            name: userData.name,
            role: userData.role,
            emailVerified: true,
            needsProfileCompletion: true // They need to join an org
          })
          .returning();

        console.log(`✅ Created ${userData.role}: ${userData.email}`);
      } else {
        console.log(`⚠️  User ${userData.email} already exists`);
      }
    }

    // 3. Display summary
    console.log('\n📊 === SETUP COMPLETE ===\n');
    console.log('Organizations created with access codes:');
    console.log('----------------------------------------');

    const orgsWithCodes = await db
      .select({
        orgName: organization.name,
        orgType: organization.type,
        code: organizationCode.code,
        codeType: organizationCode.type,
        maxUses: organizationCode.maxUses,
        expiresAt: organizationCode.expiresAt
      })
      .from(organization)
      .leftJoin(organizationCode, eq(organization.id, organizationCode.organizationId))
      .where(eq(organizationCode.isActive, true));

    let currentOrg = '';
    orgsWithCodes.forEach(row => {
      if (row.orgName !== currentOrg) {
        currentOrg = row.orgName!;
        console.log(`\n🏢 ${currentOrg} (${row.orgType})`);
      }
      const expiry = row.expiresAt ? `expires ${row.expiresAt.toLocaleDateString()}` : 'no expiration';
      const uses = row.maxUses ? `${row.maxUses} uses` : 'unlimited';
      console.log(`   ${row.code} - ${row.codeType} (${uses}, ${expiry})`);
    });

    console.log('\n✅ Test users created:');
    console.log('   - Admin: admin@hospital-system.com');
    console.log('   - Doctor: doctor1@hospital.com');
    console.log('   - Nurse: nurse1@hospital.com');
    console.log('   - Operator: operator1@hospital.com');
    console.log('   - Head Doctor: headdoc1@hospital.com');
    console.log('   - Manager: manager1@hospital.com');
    console.log('   - Regular User: user1@example.com');

    console.log('\n📝 Next Steps:');
    console.log('1. Healthcare users should use organization codes to join');
    console.log('2. Admin can create new organizations or join existing ones');
    console.log('3. Regular users can optionally join organizations');

  } catch (error) {
    console.error('❌ Error setting up organizations:', error);
  } finally {
    process.exit(0);
  }
}

// Run the setup
setupTestOrganizations();