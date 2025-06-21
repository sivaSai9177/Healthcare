#!/usr/bin/env bun
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

interface TestResult {
  file: string;
  status: 'pass' | 'fail' | 'skip';
  tests: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  errors: string[];
}

interface TestReport {
  timestamp: string;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  coverage: {
    lines: number;
    statements: number;
    functions: number;
    branches: number;
  };
  results: TestResult[];
}

async function runTests(): Promise<string> {
  console.log('🧪 Running all tests...');
  try {
    const { stdout, stderr } = await execAsync('npm test -- --json --outputFile=test-results.json --ci --coverage', {
      maxBuffer: 1024 * 1024 * 10 // 10MB buffer
    });
    return stdout + stderr;
  } catch (error: any) {
    // Tests failing is expected, we want the output
    return error.stdout + error.stderr;
  }
}

async function parseTestResults(): Promise<TestReport> {
  try {
    const resultsPath = path.join(process.cwd(), 'test-results.json');
    const coveragePath = path.join(process.cwd(), 'coverage/coverage-summary.json');
    
    // Default report structure
    const report: TestReport = {
      timestamp: new Date().toISOString(),
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      coverage: {
        lines: 0,
        statements: 0,
        functions: 0,
        branches: 0
      },
      results: []
    };

    // Parse test results if available
    try {
      const testData = await fs.readFile(resultsPath, 'utf-8');
      const results = JSON.parse(testData);
      
      // Process test results
      if (results.testResults) {
        results.testResults.forEach((suite: any) => {
          const result: TestResult = {
            file: suite.name.replace(process.cwd(), '.'),
            status: suite.status === 'passed' ? 'pass' : 'fail',
            tests: suite.numTotalTests || 0,
            passed: suite.numPassingTests || 0,
            failed: suite.numFailingTests || 0,
            skipped: suite.numPendingTests || 0,
            duration: suite.perfStats?.runtime || 0,
            errors: suite.failureMessage ? [suite.failureMessage] : []
          };
          
          report.results.push(result);
          report.total += result.tests;
          report.passed += result.passed;
          report.failed += result.failed;
          report.skipped += result.skipped;
        });
      }
    } catch (error) {
      console.log('⚠️  Could not parse test results file');
    }

    // Parse coverage if available
    try {
      const coverageData = await fs.readFile(coveragePath, 'utf-8');
      const coverage = JSON.parse(coverageData);
      
      if (coverage.total) {
        report.coverage = {
          lines: coverage.total.lines.pct || 0,
          statements: coverage.total.statements.pct || 0,
          functions: coverage.total.functions.pct || 0,
          branches: coverage.total.branches.pct || 0
        };
      }
    } catch (error) {
      console.log('⚠️  No coverage data available');
    }

    return report;
  } catch (error) {
    console.error('Error parsing test results:', error);
    throw error;
  }
}

async function updateTestTracker(report: TestReport) {
  const trackerPath = path.join(process.cwd(), 'TEST_TRACKER.md');
  
  const content = `# Test Tracker Dashboard

> Last Updated: ${new Date().toLocaleDateString()}
> Total Tests: ${report.total} | Passing: ${report.passed} | Failing: ${report.failed} | Coverage: ${report.coverage.lines}%

## Summary
- ✅ Passing: ${report.passed} tests
- ❌ Failing: ${report.failed} tests
- ⏭️ Skipped: ${report.skipped} tests

## Coverage Report
- Lines: ${report.coverage.lines}%
- Statements: ${report.coverage.statements}%
- Functions: ${report.coverage.functions}%
- Branches: ${report.coverage.branches}%

## Recent Test Run Results
${report.results.map(r => 
  `- ${r.status === 'pass' ? '✅' : '❌'} ${r.file} (${r.passed}/${r.tests} passed)`
).join('\n')}
`;

  await fs.writeFile(trackerPath, content);
  console.log('✅ Updated TEST_TRACKER.md');
}

async function generateDetailedReport(report: TestReport) {
  const reportPath = path.join(process.cwd(), `test-report-${Date.now()}.json`);
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(`📊 Detailed report saved to: ${reportPath}`);
}

async function main() {
  try {
    console.log('🚀 Starting test report generation...\n');
    
    // Run tests
    await runTests();
    
    // Parse results
    const report = await parseTestResults();
    
    // Update tracker
    await updateTestTracker(report);
    
    // Generate detailed report
    await generateDetailedReport(report);
    
    // Print summary
    console.log('\n📈 Test Summary:');
    console.log(`   Total: ${report.total}`);
    console.log(`   ✅ Passed: ${report.passed}`);
    console.log(`   ❌ Failed: ${report.failed}`);
    console.log(`   ⏭️ Skipped: ${report.skipped}`);
    console.log(`   📊 Coverage: ${report.coverage.lines}%`);
    
  } catch (error) {
    console.error('❌ Error generating test report:', error);
    process.exit(1);
  }
}

main();