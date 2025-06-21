#!/usr/bin/env bun
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface ErrorCategory {
  pattern: RegExp;
  category: string;
  count: number;
  examples: string[];
}

async function analyzeTypeScriptErrors() {

  try {
    // Run TypeScript compiler and capture errors
    const { stdout, stderr } = await execAsync('npx tsc --noEmit 2>&1', {
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    }).catch(e => ({ stdout: e.stdout || '', stderr: e.stderr || '' }));
    
    const output = stdout + stderr;
    const lines = output.split('\n');
    
    // Define error categories
    const categories: ErrorCategory[] = [
      {
        pattern: /Property '.*' does not exist on type/,
        category: 'Missing Properties',
        count: 0,
        examples: []
      },
      {
        pattern: /Type '.*' is not assignable to type/,
        category: 'Type Mismatch',
        count: 0,
        examples: []
      },
      {
        pattern: /Cannot find module/,
        category: 'Missing Modules',
        count: 0,
        examples: []
      },
      {
        pattern: /Conversion of type .* to type .* may be a mistake/,
        category: 'Type Conversion Issues',
        count: 0,
        examples: []
      },
      {
        pattern: /Object is possibly 'null' or 'undefined'/,
        category: 'Null/Undefined Checks',
        count: 0,
        examples: []
      },
      {
        pattern: /Cannot find name/,
        category: 'Undefined Variables',
        count: 0,
        examples: []
      },
      {
        pattern: /Argument of type .* is not assignable to parameter/,
        category: 'Function Argument Errors',
        count: 0,
        examples: []
      }
    ];
    
    // Categorize errors
    const uncategorized: string[] = [];
    let totalErrors = 0;
    
    for (const line of lines) {
      if (line.includes('error TS')) {
        totalErrors++;
        let categorized = false;
        
        for (const category of categories) {
          if (category.pattern.test(line)) {
            category.count++;
            if (category.examples.length < 3) {
              category.examples.push(line.trim());
            }
            categorized = true;
            break;
          }
        }
        
        if (!categorized && uncategorized.length < 10) {
          uncategorized.push(line.trim());
        }
      }
    }
    
    // File-based analysis
    const fileErrors = new Map<string, number>();
    const errorsByDirectory = new Map<string, number>();
    
    for (const line of lines) {
      const fileMatch = line.match(/^(.+?)\(\d+,\d+\):/);
      if (fileMatch) {
        const file = fileMatch[1];
        fileErrors.set(file, (fileErrors.get(file) || 0) + 1);
        
        // Directory analysis
        const dir = file.substring(0, file.lastIndexOf('/'));
        errorsByDirectory.set(dir, (errorsByDirectory.get(dir) || 0) + 1);
      }
    }
    
    // Sort and display results

    categories
      .sort((a, b) => b.count - a.count)
      .forEach(cat => {
        if (cat.count > 0) {

          cat.examples.forEach(ex => {

          });
        }
      });
    
    if (uncategorized.length > 0) {

      uncategorized.slice(0, 3).forEach(ex => {

      });
    }

    Array.from(errorsByDirectory.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([dir, count]) => {

      });

    Array.from(fileErrors.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([file, count]) => {

      });
    
    // Provide recommendations

    const topCategory = categories.sort((a, b) => b.count - a.count)[0];
    if (topCategory && topCategory.count > 0) {

    }
    
    const topDir = Array.from(errorsByDirectory.entries())
      .sort((a, b) => b[1] - a[1])[0];
    if (topDir) {

    }

  } catch (error) {
    console.error('Error analyzing TypeScript errors:', error);
  }
}

// Run the analysis
analyzeTypeScriptErrors();