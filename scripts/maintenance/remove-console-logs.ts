#!/usr/bin/env bun
/**
 * Remove console.log statements from the codebase
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

class ConsoleLogRemover {
  private filesProcessed = 0;
  private logsRemoved = 0;
  private errors: string[] = [];

  async removeConsoleLogs() {
    console.log('🧹 Removing console.log statements...\n');

    // Find all TypeScript and JavaScript files using find command
    const findCmd = `find . -type f \\( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \\) -not -path "./node_modules/*" -not -path "./.expo/*" -not -path "./dist/*" -not -path "./build/*" -not -path "./coverage/*" -not -name "*.config.*" -not -path "./scripts/maintenance/remove-console-logs.ts"`;
    
    const filesStr = execSync(findCmd, { encoding: 'utf8' });
    const files = filesStr.trim().split('\n').filter(f => f.length > 0);

    console.log(`Found ${files.length} files to process\n`);

    // Process each file
    for (const file of files) {
      await this.processFile(file);
    }

    // Print summary
    this.printSummary();
  }

  private async processFile(filePath: string) {
    try {
      const content = await fs.promises.readFile(filePath, 'utf8');
      
      // Skip if no console.log found
      if (!content.includes('console.log')) {
        return;
      }

      // Remove console.log statements (single and multi-line)
      let newContent = content;
      let count = 0;

      // Pattern 1: Simple console.log on single line
      const simplePattern = /^\s*console\.log\([^;]*\);?\s*$/gm;
      const simpleMatches = content.match(simplePattern);
      if (simpleMatches) {
        count += simpleMatches.length;
        newContent = newContent.replace(simplePattern, '');
      }

      // Pattern 2: Multi-line console.log
      const multilinePattern = /^\s*console\.log\([^)]*\n([^)]*\n)*[^)]*\);?\s*$/gm;
      const multilineMatches = content.match(multilinePattern);
      if (multilineMatches) {
        count += multilineMatches.length;
        newContent = newContent.replace(multilinePattern, '');
      }

      // Pattern 3: Console.log in if statements or other contexts (comment them out)
      const inlinePattern = /console\.log\([^)]*\)/g;
      const remainingMatches = newContent.match(inlinePattern);
      if (remainingMatches) {
        count += remainingMatches.length;
        // Comment out instead of removing for inline cases
        newContent = newContent.replace(inlinePattern, (match) => `/* ${match} */`);
      }

      // Clean up extra blank lines
      newContent = newContent.replace(/\n\s*\n\s*\n/g, '\n\n');

      // Write back if changed
      if (newContent !== content) {
        await fs.promises.writeFile(filePath, newContent, 'utf8');
        this.filesProcessed++;
        this.logsRemoved += count;
        console.log(`✅ ${filePath} - Removed ${count} console.log statements`);
      }
    } catch (error) {
      this.errors.push(`Error processing ${filePath}: ${error.message}`);
    }
  }

  private printSummary() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 Summary:');
    console.log('='.repeat(50));
    console.log(`Files processed: ${this.filesProcessed}`);
    console.log(`Console.log statements removed: ${this.logsRemoved}`);
    
    if (this.errors.length > 0) {
      console.log(`\n❌ Errors: ${this.errors.length}`);
      this.errors.forEach(err => console.log(`  - ${err}`));
    }

    console.log('\n✨ Done! The codebase is now cleaner.');
    console.log('\n💡 Note: Some console.log statements were commented out instead of removed.');
    console.log('   Review these manually in case they contain important debugging info.');
  }
}

// Run the remover
const remover = new ConsoleLogRemover();
remover.removeConsoleLogs().catch(console.error);