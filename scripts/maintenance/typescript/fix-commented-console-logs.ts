#!/usr/bin/env bun
/**
 * Fix TypeScript errors caused by commented console.log statements
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

class CommentedConsoleLogFixer {
  private filesFixed = 0;
  private errorsFixed = 0;

  async fixCommentedConsoleLogs() {
    console.log('🔧 Fixing TypeScript errors from commented console.logs...\n');

    // Get TypeScript errors
    const errors = this.getTypeScriptErrors();
    
    // Group errors by file
    const errorsByFile = new Map<string, {line: number, column: number}[]>();
    
    for (const error of errors) {
      const match = error.match(/^(.+)\((\d+),(\d+)\): error TS1109:/);
      if (match) {
        const [, file, line, column] = match;
        if (!errorsByFile.has(file)) {
          errorsByFile.set(file, []);
        }
        errorsByFile.get(file)!.push({ line: parseInt(line), column: parseInt(column) });
      }
    }

    console.log(`Found ${errorsByFile.size} files with TS1109 errors\n`);

    // Fix each file
    for (const [file, positions] of errorsByFile) {
      await this.fixFile(file, positions);
    }

    // Print summary
    this.printSummary();
  }

  private getTypeScriptErrors(): string[] {
    try {
      execSync('bunx tsc --noEmit', { encoding: 'utf8' });
      return [];
    } catch (error: any) {
      return error.stdout.split('\n').filter((line: string) => line.includes('error TS1109'));
    }
  }

  private async fixFile(filePath: string, positions: {line: number, column: number}[]) {
    try {
      const content = await fs.promises.readFile(filePath, 'utf8');
      const lines = content.split('\n');
      let fixed = false;

      // Sort positions by line number (descending) to avoid offset issues
      positions.sort((a, b) => b.line - a.line);

      for (const { line, column } of positions) {
        const lineIndex = line - 1;
        if (lineIndex < lines.length) {
          const currentLine = lines[lineIndex];
          
          // Look for commented console.log patterns
          if (currentLine.includes('/* console.log')) {
            // Remove the entire commented console.log
            lines[lineIndex] = currentLine.replace(/\/\*\s*console\.log\([^)]*\)\s*\*\//g, '{}');
            fixed = true;
            this.errorsFixed++;
          }
        }
      }

      if (fixed) {
        await fs.promises.writeFile(filePath, lines.join('\n'), 'utf8');
        this.filesFixed++;
        console.log(`✅ Fixed ${filePath}`);
      }
    } catch (error) {
      console.error(`❌ Error fixing ${filePath}: ${error.message}`);
    }
  }

  private printSummary() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 Summary:');
    console.log('='.repeat(50));
    console.log(`Files fixed: ${this.filesFixed}`);
    console.log(`Errors fixed: ${this.errorsFixed}`);
    console.log('\n✨ Done! The TypeScript errors should be resolved.');
  }
}

// Run the fixer
const fixer = new CommentedConsoleLogFixer();
fixer.fixCommentedConsoleLogs().catch(console.error);