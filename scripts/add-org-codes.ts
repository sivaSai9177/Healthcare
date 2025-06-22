import * as dotenv from 'dotenv';
import * as path from 'path';
import { nanoid } from 'nanoid';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, sql, and, isNull } from 'drizzle-orm';

import { organization, organizationCode, organizationMember } from '../src/db/organization-schema';
import { user } from '../src/db/schema';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// Direct database connection
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
if (!connectionString) {
  console.error('❌ No database connection string found in environment variables');
  process.exit(1);
}

const pgSql = postgres(connectionString);
const db = drizzle(pgSql);

// Helper to generate organization codes (max 12 chars)
const generateOrgCode = (orgName: string, suffix: string = ''): string => {
  const prefix = orgName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 4)
    .padEnd(4, 'X');
  const randomSuffix = nanoid(6).toUpperCase();
  
  // Format: XXXX-YYYYYY (11 chars total)
  return `${prefix}-${randomSuffix}`;
};

async function addOrganizationCodes() {
  try {
    console.log('\n🔍 Checking existing organizations...\n');

    // Get all organizations
    const orgs = await db
      .select({
        id: organization.id,
        name: organization.name,
        type: organization.type,
        createdBy: organization.createdBy
      })
      .from(organization)
      .where(eq(organization.status, 'active'));

    console.log(`Found ${orgs.length} active organizations\n`);

    // For each organization, check if it has codes
    for (const org of orgs) {
      console.log(`\n📍 Organization: ${org.name}`);
      
      // Check existing codes
      const existingCodes = await db
        .select({
          code: organizationCode.code,
          type: organizationCode.type,
          isActive: organizationCode.isActive
        })
        .from(organizationCode)
        .where(eq(organizationCode.organizationId, org.id));

      const activeCodes = existingCodes.filter(c => c.isActive);
      
      if (activeCodes.length > 0) {
        console.log(`   ✅ Already has ${activeCodes.length} active codes:`);
        activeCodes.forEach(c => {
          console.log(`      - ${c.code} (${c.type})`);
        });
        continue;
      }

      console.log(`   ⚠️  No active codes found. Creating new codes...`);

      // Find an admin user to set as creator (prefer the org creator)
      let creatorId = org.createdBy;
      if (!creatorId) {
        const adminUsers = await db
          .select({ id: user.id })
          .from(user)
          .where(eq(user.role, 'admin'))
          .limit(1);
        
        if (adminUsers.length > 0) {
          creatorId = adminUsers[0].id;
        }
      }

      if (!creatorId) {
        console.log(`   ❌ No admin user found to create codes`);
        continue;
      }

      // Create 3 types of codes for each organization

      // 1. General member code (unlimited, no expiry)
      const memberCode = generateOrgCode(org.name);
      await db.insert(organizationCode).values({
        organizationId: org.id,
        code: memberCode,
        type: 'member',
        maxUses: null,
        currentUses: 0,
        isActive: true,
        createdBy: creatorId
      });
      console.log(`   ✅ Created member code: ${memberCode} (unlimited uses)`);

      // 2. Admin code (5 uses, 30 days)
      const adminCode = generateOrgCode(org.name, 'ADM');
      const thirtyDays = new Date();
      thirtyDays.setDate(thirtyDays.getDate() + 30);
      
      await db.insert(organizationCode).values({
        organizationId: org.id,
        code: adminCode,
        type: 'admin',
        maxUses: 5,
        currentUses: 0,
        expiresAt: thirtyDays,
        isActive: true,
        createdBy: creatorId
      });
      console.log(`   ✅ Created admin code: ${adminCode} (5 uses, 30 days)`);

      // 3. Test code (50 uses, 7 days)
      const testCode = generateOrgCode(org.name, 'TEST');
      const sevenDays = new Date();
      sevenDays.setDate(sevenDays.getDate() + 7);
      
      await db.insert(organizationCode).values({
        organizationId: org.id,
        code: testCode,
        type: 'member',
        maxUses: 50,
        currentUses: 0,
        expiresAt: sevenDays,
        isActive: true,
        createdBy: creatorId
      });
      console.log(`   ✅ Created test code: ${testCode} (50 uses, 7 days)`);
    }

    // Display all active codes
    console.log('\n\n📋 === ALL ACTIVE ORGANIZATION CODES ===\n');
    
    const allCodes = await db
      .select({
        code: organizationCode.code,
        orgName: organization.name,
        type: organizationCode.type,
        maxUses: organizationCode.maxUses,
        currentUses: organizationCode.currentUses,
        expiresAt: organizationCode.expiresAt
      })
      .from(organizationCode)
      .innerJoin(organization, eq(organizationCode.organizationId, organization.id))
      .where(
        and(
          eq(organizationCode.isActive, true),
          eq(organization.status, 'active')
        )
      )
      .orderBy(organization.name);

    // Group by organization
    const codesByOrg: Record<string, typeof allCodes> = {};
    allCodes.forEach(code => {
      if (!codesByOrg[code.orgName]) {
        codesByOrg[code.orgName] = [];
      }
      codesByOrg[code.orgName].push(code);
    });

    Object.entries(codesByOrg).forEach(([orgName, codes]) => {
      console.log(`\n🏢 ${orgName}:`);
      codes.forEach(code => {
        const uses = code.maxUses ? `${code.currentUses}/${code.maxUses} uses` : 'unlimited';
        const expiry = code.expiresAt ? 
          (code.expiresAt < new Date() ? '❌ EXPIRED' : `expires ${code.expiresAt.toLocaleDateString()}`) 
          : 'no expiry';
        console.log(`   ${code.code} (${code.type}) - ${uses} - ${expiry}`);
      });
    });

    console.log('\n\n✅ === QUICK TEST CODES ===\n');
    console.log('Copy one of these codes to test login:\n');
    
    // Show the first few valid codes
    const validCodes = allCodes.filter(c => 
      (!c.expiresAt || c.expiresAt > new Date()) &&
      (!c.maxUses || c.currentUses < c.maxUses)
    ).slice(0, 5);

    validCodes.forEach(code => {
      console.log(`${code.code} - ${code.orgName} (${code.type})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pgSql.end();
    process.exit(0);
  }
}

// Run the script
addOrganizationCodes();