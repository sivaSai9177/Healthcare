#!/usr/bin/env bun
/**
 * Script Organization Tool
 * Helps identify and rename scripts to follow consistent conventions
 */

import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { initScript } from '../config/utils';

interface ScriptInfo {
  path: string;
  name: string;
  category: string;
  suggestedName?: string;
  issues: string[];
}

const NAMING_PATTERNS = {
  test: /^test-/,
  setup: /^setup-/,
  manage: /^(create|update|delete|fix|check)-/,
  debug: /^debug-/,
  start: /^start-/,
};

const CATEGORY_PREFIXES: Record<string, string> = {
  test: 'test-',
  setup: 'setup-',
  management: 'manage-',
  debug: 'debug-',
  services: 'start-',
};

async function scanDirectory(dir: string, baseDir: string = ''): Promise<ScriptInfo[]> {
  const scripts: ScriptInfo[] = [];
  const entries = await readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    const relativePath = join(baseDir, entry.name);
    
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      const subScripts = await scanDirectory(fullPath, relativePath);
      scripts.push(...subScripts);
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.js') || entry.name.endsWith('.sh'))) {
      const scriptInfo = analyzeScript(fullPath, entry.name, baseDir);
      scripts.push(scriptInfo);
    }
  }
  
  return scripts;
}

function analyzeScript(path: string, name: string, directory: string): ScriptInfo {
  const issues: string[] = [];
  let category = 'unknown';
  let suggestedName: string | undefined;
  
  // Check file extension
  if (name.endsWith('.sh')) {
    issues.push('Shell script - should be converted to TypeScript');
  }
  
  // Analyze name patterns
  const nameWithoutExt = name.replace(/\.(ts|js|sh)$/, '');
  
  // Check for test scripts
  if (nameWithoutExt.includes('test') || directory.includes('test')) {
    category = 'test';
    if (!nameWithoutExt.startsWith('test-')) {
      suggestedName = `test-${nameWithoutExt.replace(/[-_]?test[-_]?/gi, '')}`;
      issues.push(`Test script should start with 'test-'`);
    }
  }
  
  // Check for setup scripts
  else if (nameWithoutExt.includes('setup') || nameWithoutExt.includes('init') || directory.includes('setup')) {
    category = 'setup';
    if (!nameWithoutExt.startsWith('setup-')) {
      suggestedName = `setup-${nameWithoutExt.replace(/[-_]?(setup|init)[-_]?/gi, '')}`;
      issues.push(`Setup script should start with 'setup-'`);
    }
  }
  
  // Check for management scripts
  else if (/^(create|update|delete|fix|check|make|assign|map)/.test(nameWithoutExt)) {
    category = 'management';
    const action = nameWithoutExt.match(/^(create|update|delete|fix|check|make|assign|map)/)?.[1];
    const subject = nameWithoutExt.replace(/^(create|update|delete|fix|check|make|assign|map)[-_]?/, '');
    suggestedName = `manage-${subject}`;
    issues.push(`Management script should be consolidated into 'manage-' pattern`);
  }
  
  // Check for service scripts
  else if (nameWithoutExt.includes('start') || nameWithoutExt.includes('run') || directory.includes('services')) {
    category = 'services';
    if (!nameWithoutExt.startsWith('start-')) {
      suggestedName = `start-${nameWithoutExt.replace(/[-_]?(start|run)[-_]?/gi, '')}`;
      issues.push(`Service script should start with 'start-'`);
    }
  }
  
  // Check for debug scripts
  else if (nameWithoutExt.includes('debug') || directory.includes('debug')) {
    category = 'debug';
    if (!nameWithoutExt.startsWith('debug-')) {
      suggestedName = `debug-${nameWithoutExt.replace(/[-_]?debug[-_]?/gi, '')}`;
      issues.push(`Debug script should start with 'debug-'`);
    }
  }
  
  // Check for ambiguous suffixes
  if (nameWithoutExt.endsWith('-simple') || nameWithoutExt.endsWith('-complete') || nameWithoutExt.endsWith('-local')) {
    issues.push('Has ambiguous suffix that should be removed or clarified');
  }
  
  // Check for duplicate indicators
  if (nameWithoutExt.includes('-copy') || nameWithoutExt.includes('-old') || nameWithoutExt.includes('-backup')) {
    issues.push('Appears to be a duplicate or backup file');
  }
  
  return {
    path,
    name,
    category,
    suggestedName: suggestedName ? `${suggestedName}${name.match(/\.(ts|js|sh)$/)?.[0]}` : undefined,
    issues,
  };
}

async function main() {
  const scriptsDir = join(process.cwd(), 'scripts');

  const scripts = await scanDirectory(scriptsDir);
  
  // Group by category
  const byCategory = scripts.reduce((acc, script) => {
    if (!acc[script.category]) acc[script.category] = [];
    acc[script.category].push(script);
    return acc;
  }, {} as Record<string, ScriptInfo[]>);
  
  // Report findings

  // Scripts with issues
  const scriptsWithIssues = scripts.filter(s => s.issues.length > 0);
  if (scriptsWithIssues.length > 0) {

    scriptsWithIssues.forEach(script => {

      script.issues.forEach(issue => {});
      if (script.suggestedName) {

      }

    });
  }
  
  // Category breakdown

  Object.entries(byCategory).forEach(([category, categoryScripts]) => {

    categoryScripts.slice(0, 5).forEach(script => {

    });
    if (categoryScripts.length > 5) {

    }
  });
  
  // Shell scripts that need conversion
  const shellScripts = scripts.filter(s => s.name.endsWith('.sh'));
  if (shellScripts.length > 0) {

    shellScripts.forEach(script => {

    });

  }
  
  // Duplicate patterns

  // Find scripts with similar names
  const nameGroups: Record<string, ScriptInfo[]> = {};
  scripts.forEach(script => {
    const baseName = script.name
      .replace(/\.(ts|js|sh)$/, '')
      .replace(/-simple|-complete|-local|-test|-demo/, '');
    
    if (!nameGroups[baseName]) nameGroups[baseName] = [];
    nameGroups[baseName].push(script);
  });
  
  Object.entries(nameGroups)
    .filter(([_, group]) => group.length > 1)
    .forEach(([baseName, group]) => {

      group.forEach(script => {});
    });

}

initScript(
  {
    name: 'Script Organization Analysis',
    description: 'Analyze and suggest improvements for script organization',
  },
  main
);