#!/usr/bin/env bun
/**
 * Generate API documentation from tRPC routers
 * This script extracts route information and generates markdown documentation
 */

import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

interface RouteInfo {
  name: string;
  type: 'query' | 'mutation' | 'subscription';
  auth: string;
  description?: string;
  input?: string;
  output?: string;
}

interface RouterInfo {
  name: string;
  routes: RouteInfo[];
}

async function extractRoutesFromFile(filePath: string): Promise<RouteInfo[]> {
  const content = await readFile(filePath, 'utf-8');
  const routes: RouteInfo[] = [];
  
  // Match tRPC route definitions
  const routeMatches = content.matchAll(
    /(\w+):\s*(protected|public|admin|healthcare|operator)?Procedure[\s\S]*?\.(query|mutation|subscription)\(/g
  );
  
  for (const match of routeMatches) {
    const [, routeName, auth, routeType] = match;
    routes.push({
      name: routeName,
      type: routeType as 'query' | 'mutation' | 'subscription',
      auth: auth || 'public',
    });
  }
  
  return routes;
}

async function generateRouterDocs(): Promise<RouterInfo[]> {
  const routersDir = join(process.cwd(), 'src/server/routers');
  const files = await readdir(routersDir);
  const routers: RouterInfo[] = [];
  
  for (const file of files) {
    if (file.endsWith('.ts') && file !== 'index.ts') {
      const filePath = join(routersDir, file);
      const routes = await extractRoutesFromFile(filePath);
      
      if (routes.length > 0) {
        routers.push({
          name: file.replace('.ts', ''),
          routes,
        });
      }
    }
  }
  
  return routers;
}

function generateMarkdown(routers: RouterInfo[]): string {
  let markdown = `# Auto-Generated API Documentation

Generated on: ${new Date().toISOString()}

## Available Routers

`;

  for (const router of routers) {
    markdown += `### ${router.name}\n\n`;
    markdown += `| Route | Type | Auth Required | Description |\n`;
    markdown += `|-------|------|---------------|-------------|\n`;
    
    for (const route of router.routes) {
      const authBadge = route.auth === 'public' ? '❌' : '✅';
      const typeBadge = route.type === 'query' ? '🔍' : 
                       route.type === 'mutation' ? '✏️' : '📡';
      
      markdown += `| \`${router.name}.${route.name}\` | ${typeBadge} ${route.type} | ${authBadge} ${route.auth} | - |\n`;
    }
    
    markdown += '\n';
  }
  
  markdown += `\n## Legend

- 🔍 Query: Read data
- ✏️ Mutation: Create/Update/Delete data
- 📡 Subscription: Real-time updates
- ✅ Auth Required
- ❌ Public Route

## Usage Example

\`\`\`ts
import { api } from '@/lib/api/trpc';

// Query example
const { data } = api.healthcare.getAlerts.useQuery();

// Mutation example
const mutation = api.healthcare.createAlert.useMutation();
await mutation.mutateAsync({ 
  roomNumber: 'A301',
  urgencyLevel: 4 
});
\`\`\`

For detailed route documentation, see [tRPC Routes Documentation](/docs/api/trpc-routes.md).
`;
  
  return markdown;
}

async function main() {
  try {

    const routers = await generateRouterDocs();

    const markdown = generateMarkdown(routers);
    const outputPath = join(process.cwd(), 'docs/api/generated-routes.md');
    
    await writeFile(outputPath, markdown);

    // Summary
    const totalRoutes = routers.reduce((sum, r) => sum + r.routes.length, 0);

  } catch (error) {
    console.error('❌ Error generating documentation:', error);
    process.exit(1);
  }
}

main();