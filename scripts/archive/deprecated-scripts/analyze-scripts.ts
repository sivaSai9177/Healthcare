#!/usr/bin/env bun
/**
 * Analyze Scripts
 * 
 * Analyzes all scripts in the scripts directory to generate metrics for:
 * - TypeScript vs Shell scripts
 * - Scripts with/without error handling
 * - Duplicate functionality
 * - Hardcoded values
 * 
 * Usage:
 *   bun run scripts/analyze-scripts.ts
 */

import { readdir, readFile } from 'fs/promises';
import { join, extname, basename } from 'path';
import { logger, withSpinner } from './lib';
import { COLORS, EMOJI } from './config/constants';

interface ScriptAnalysis {
  path: string;
  name: string;
  extension: string;
  isTypeScript: boolean;
  hasErrorHandling: boolean;
  hasHardcodedValues: boolean;
  imports: string[];
  size: number;
  category: string;
}

async function main() {
  try {
    logger.box('Script Analysis Report');
    
    const scripts = await withSpinner('Analyzing scripts...', async () => {
      return await analyzeDirectory('.');
    });
    
    // Generate report
    generateReport(scripts);
    
  } catch (error) {
    logger.error('Analysis failed:', error);
    process.exit(1);
  }
}

async function analyzeDirectory(dir: string): Promise<ScriptAnalysis[]> {
  const results: ScriptAnalysis[] = [];
  const entries = await readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    
    if (entry.isDirectory()) {
      // Skip special directories
      if (['node_modules', 'lib', 'config', 'templates'].includes(entry.name)) {
        continue;
      }
      
      // Recursively analyze subdirectories
      const subResults = await analyzeDirectory(fullPath);
      results.push(...subResults);
    } else if (entry.isFile()) {
      // Analyze script files
      const ext = extname(entry.name);
      if (['.ts', '.js', '.sh'].includes(ext)) {
        const analysis = await analyzeScript(fullPath);
        if (analysis) {
          results.push(analysis);
        }
      }
    }
  }
  
  return results;
}

async function analyzeScript(filePath: string): Promise<ScriptAnalysis | null> {
  try {
    const content = await readFile(filePath, 'utf-8');
    const name = basename(filePath);
    const ext = extname(filePath);
    
    // Skip template files
    if (name.includes('.template.')) {
      return null;
    }
    
    // Determine category from path
    const pathParts = filePath.split('/');
    const categoryIndex = pathParts.indexOf('scripts') + 1;
    const category = pathParts[categoryIndex] || 'root';
    
    return {
      path: filePath,
      name,
      extension: ext,
      isTypeScript: ext === '.ts',
      hasErrorHandling: checkErrorHandling(content, ext),
      hasHardcodedValues: checkHardcodedValues(content),
      imports: extractImports(content),
      size: content.length,
      category,
    };
  } catch (error) {
    logger.warn(`Failed to analyze ${filePath}: ${error.message}`);
    return null;
  }
}

function checkErrorHandling(content: string, ext: string): boolean {
  if (ext === '.sh') {
    return content.includes('set -e') || content.includes('trap');
  }
  
  return (
    content.includes('try') && content.includes('catch') ||
    content.includes('handleError') ||
    content.includes('.catch(')
  );
}

function checkHardcodedValues(content: string): boolean {
  const patterns = [
    /localhost:\d{4}/,
    /postgresql:\/\/[^$]/,
    /redis:\/\/[^$]/,
    /http:\/\/localhost/,
    /admin@/,
    /password.*=.*["'](?!.*\$)/,
  ];
  
  return patterns.some(pattern => pattern.test(content));
}

function extractImports(content: string): string[] {
  const imports: string[] = [];
  const importRegex = /import\s+.*\s+from\s+['"]([^'"]+)['"]/g;
  
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  
  return imports;
}

function generateReport(scripts: ScriptAnalysis[]) {
  const total = scripts.length;
  const tsScripts = scripts.filter(s => s.isTypeScript);
  const shellScripts = scripts.filter(s => s.extension === '.sh');
  const withErrorHandling = scripts.filter(s => s.hasErrorHandling);
  const withHardcoded = scripts.filter(s => s.hasHardcodedValues);
  
  // Group by category
  const byCategory = scripts.reduce((acc, script) => {
    if (!acc[script.category]) {
      acc[script.category] = [];
    }
    acc[script.category].push(script);
    return acc;
  }, {} as Record<string, ScriptAnalysis[]>);
  
  // Find potential duplicates
  const duplicates = findDuplicates(scripts);
  
  logger.separator('=', 60);
  logger.info(`${COLORS.bright}Summary${COLORS.reset}`);
  logger.separator('-', 60);
  
  logger.info(`Total Scripts: ${total}`);
  logger.info(`TypeScript: ${tsScripts.length} (${percent(tsScripts.length, total)})`);
  logger.info(`Shell Scripts: ${shellScripts.length} (${percent(shellScripts.length, total)})`);
  logger.info(`With Error Handling: ${withErrorHandling.length} (${percent(withErrorHandling.length, total)})`);
  logger.info(`With Hardcoded Values: ${withHardcoded.length} (${percent(withHardcoded.length, total)})`);
  
  logger.separator('=', 60);
  logger.info(`${COLORS.bright}By Category${COLORS.reset}`);
  logger.separator('-', 60);
  
  Object.entries(byCategory)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([category, scripts]) => {
      const tsCount = scripts.filter(s => s.isTypeScript).length;
      logger.info(`${category}: ${scripts.length} scripts (${tsCount} TS, ${scripts.length - tsCount} Shell)`);
    });
  
  if (duplicates.length > 0) {
    logger.separator('=', 60);
    logger.warn(`${COLORS.bright}Potential Duplicates${COLORS.reset}`);
    logger.separator('-', 60);
    
    duplicates.forEach(group => {
      logger.warn(`Similar scripts detected:`);
      group.forEach(script => {
        logger.info(`  - ${script.path}`);
      });
    });
  }
  
  logger.separator('=', 60);
  logger.info(`${COLORS.bright}Scripts Needing Conversion${COLORS.reset}`);
  logger.separator('-', 60);
  
  shellScripts
    .sort((a, b) => b.size - a.size) // Largest first
    .slice(0, 10)
    .forEach(script => {
      logger.info(`${EMOJI.arrow} ${script.path} (${formatSize(script.size)})`);
    });
  
  logger.separator('=', 60);
  logger.info(`${COLORS.bright}Scripts With Hardcoded Values${COLORS.reset}`);
  logger.separator('-', 60);
  
  withHardcoded
    .slice(0, 10)
    .forEach(script => {
      logger.warn(`${EMOJI.warning} ${script.path}`);
    });
  
  // Save detailed report
  saveDetailedReport(scripts);
}

function findDuplicates(scripts: ScriptAnalysis[]): ScriptAnalysis[][] {
  const groups: ScriptAnalysis[][] = [];
  const processed = new Set<string>();
  
  const similarityPatterns = [
    /create.*user/i,
    /reset.*database/i,
    /test.*auth/i,
    /fix.*oauth/i,
    /setup.*healthcare/i,
  ];
  
  for (const pattern of similarityPatterns) {
    const matches = scripts.filter(s => 
      pattern.test(s.name) && !processed.has(s.path)
    );
    
    if (matches.length > 1) {
      groups.push(matches);
      matches.forEach(m => processed.add(m.path));
    }
  }
  
  return groups;
}

function percent(value: number, total: number): string {
  return `${Math.round((value / total) * 100)}%`;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

async function saveDetailedReport(scripts: ScriptAnalysis[]) {
  const report = {
    generated: new Date().toISOString(),
    summary: {
      total: scripts.length,
      typescript: scripts.filter(s => s.isTypeScript).length,
      shell: scripts.filter(s => s.extension === '.sh').length,
      withErrorHandling: scripts.filter(s => s.hasErrorHandling).length,
      withHardcodedValues: scripts.filter(s => s.hasHardcodedValues).length,
    },
    scripts: scripts.sort((a, b) => a.path.localeCompare(b.path)),
  };
  
  await Bun.write(
    './scripts/analysis-report.json',
    JSON.stringify(report, null, 2)
  );
  
  logger.success(`\nDetailed report saved to: scripts/analysis-report.json`);
}

// Run the analysis
main();