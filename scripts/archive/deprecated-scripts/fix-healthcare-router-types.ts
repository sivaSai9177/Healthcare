#!/usr/bin/env bun
/**
 * Script to fix TypeScript errors in healthcare router
 */

import { readFile, writeFile } from 'fs/promises';

const HEALTHCARE_ROUTER_PATH = './src/server/routers/healthcare.ts';

async function fixHealthcareRouter() {
  try {
    let content = await readFile(HEALTHCARE_ROUTER_PATH, 'utf-8');
    let changeCount = 0;
    
    // Replace ctx.user.organizationId with ctx.hospitalContext?.userOrganizationId
    const orgIdPattern = /ctx\.user\.organizationId/g;
    const orgIdMatches = content.match(orgIdPattern);
    if (orgIdMatches) {
      changeCount += orgIdMatches.length;
      content = content.replace(orgIdPattern, 'ctx.hospitalContext?.userOrganizationId');
    }
    
    // Replace ctx.user.role with proper type casting or database lookup
    const rolePattern = /ctx\.user\.role/g;
    const roleMatches = content.match(rolePattern);
    if (roleMatches) {
      changeCount += roleMatches.length;
      content = content.replace(rolePattern, '(ctx.user as any).role');
    }
    
    // Fix headers access - replace ctx.headers with ctx.req.headers
    const headersPattern = /ctx\.headers/g;
    const headersMatches = content.match(headersPattern);
    if (headersMatches) {
      changeCount += headersMatches.length;
      content = content.replace(headersPattern, 'ctx.req.headers');
    }
    
    // Fix number/string comparison for urgencyLevel
    const urgencyPattern = /urgencyLevel === '(\d+)'/g;
    content = content.replace(urgencyPattern, 'urgencyLevel === $1');
    
    // Add type assertions where needed for database queries
    content = content.replace(
      /const userOrganizationId = ctx\.user\.organizationId/g,
      'const userOrganizationId = ctx.hospitalContext?.userOrganizationId'
    );
    
    // Save the file
    await writeFile(HEALTHCARE_ROUTER_PATH, content);

    // Also need to ensure the router uses the extended context properly

  } catch (error) {
    console.error('❌ Error fixing healthcare router:', error);
  }
}

async function main() {

  await fixHealthcareRouter();

}

main().catch(console.error);