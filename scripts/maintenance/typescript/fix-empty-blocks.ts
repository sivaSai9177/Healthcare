#!/usr/bin/env bun
/**
 * Fix empty block statements in TypeScript files
 */

import fs from 'fs';
import { execSync } from 'child_process';

class EmptyBlockFixer {
  private filesFixed = 0;
  private errorsFixed = 0;

  async fixEmptyBlocks() {
    console.log('🔧 Fixing empty block statements...\n');

    // Get TypeScript errors
    const errors = this.getTypeScriptErrors();
    
    // Group errors by file
    const errorsByFile = new Map<string, {line: number, error: string}[]>();
    
    for (const error of errors) {
      const match = error.match(/^(.+)\((\d+),(\d+)\): error TS(\d+):/);
      if (match) {
        const [, file, line] = match;
        if (!errorsByFile.has(file)) {
          errorsByFile.set(file, []);
        }
        errorsByFile.get(file)!.push({ line: parseInt(line), error });
      }
    }

    console.log(`Found ${errorsByFile.size} files with errors\n`);

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
      return error.stdout.split('\n').filter((line: string) => line.includes('error TS'));
    }
  }

  private async fixFile(filePath: string, positions: {line: number, error: string}[]) {
    try {
      const content = await fs.promises.readFile(filePath, 'utf8');
      const lines = content.split('\n');
      let fixed = false;

      // Sort positions by line number (descending) to avoid offset issues
      positions.sort((a, b) => b.line - a.line);

      for (const { line, error } of positions) {
        const lineIndex = line - 1;
        if (lineIndex < lines.length) {
          const currentLine = lines[lineIndex];
          
          // Fix empty block statements
          if (currentLine.includes('{});')) {
            lines[lineIndex] = currentLine.replace('{});', '{}');
            fixed = true;
            this.errorsFixed++;
          }
          // Fix semicolon issues
          else if (error.includes('TS1005') && currentLine.includes('/* console.log')) {
            lines[lineIndex] = currentLine.replace(/\/\*\s*console\.log\([^)]*\)\s*\*\/;?/, '');
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
    console.log('\n✨ Done! Empty block errors should be resolved.');
  }
}

// Run the fixer
const fixer = new EmptyBlockFixer();
fixer.fixEmptyBlocks().catch(console.error);