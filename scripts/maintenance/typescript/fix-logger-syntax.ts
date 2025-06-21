#!/usr/bin/env bun
/**
 * Fix syntax errors in logger object definitions
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

class LoggerSyntaxFixer {
  private filesFixed = 0;
  private errorsFixed = 0;

  async fixLoggerSyntax() {
    console.log('🔧 Fixing logger syntax errors...\n');

    // Find all TypeScript files
    const findCmd = `find . -type f \\( -name "*.ts" -o -name "*.tsx" \\) -not -path "./node_modules/*" -not -path "./.expo/*" -not -path "./dist/*" -not -path "./build/*"`;
    const filesStr = execSync(findCmd, { encoding: 'utf8' });
    const files = filesStr.trim().split('\n').filter(f => f.length > 0);

    // Pattern to find broken logger definitions
    const loggerPattern = /const log = \{[\s\S]*?\};/gm;

    for (const file of files) {
      await this.fixFile(file);
    }

    // Print summary
    this.printSummary();
  }

  private async fixFile(filePath: string) {
    try {
      const content = await fs.promises.readFile(filePath, 'utf8');
      let newContent = content;
      let fixed = false;

      // Fix logger object syntax
      newContent = newContent.replace(/const log = \{([\s\S]*?)\};/gm, (match, loggerContent) => {
        // Check if it contains the broken pattern
        if (loggerContent.includes('=> {})')) {
          fixed = true;
          this.errorsFixed++;
          
          // Fix each line in the logger object
          const fixedContent = loggerContent
            .replace(/(\w+):\s*\([^)]*\)\s*=>\s*\{\}\)/g, '$1: (msg: string) => console.log(msg)')
            .replace(/(\w+):\s*\([^)]*\)\s*=>\s*process\.env\.DEBUG\s*&&\s*\{\}\)/g, '$1: (msg: string) => process.env.DEBUG && console.log(msg)');
          
          return `const log = {${fixedContent}};`;
        }
        return match;
      });

      // Also fix standalone logger method definitions
      newContent = newContent.replace(/(\w+):\s*\([^)]*\)\s*=>\s*\{\}\),/g, '$1: (msg: string) => {},');

      if (fixed) {
        await fs.promises.writeFile(filePath, newContent, 'utf8');
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
    console.log('\n✨ Done! Logger syntax errors should be resolved.');
  }
}

// Run the fixer
const fixer = new LoggerSyntaxFixer();
fixer.fixLoggerSyntax().catch(console.error);