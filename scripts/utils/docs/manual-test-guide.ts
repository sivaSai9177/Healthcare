#!/usr/bin/env bun

import chalk from 'chalk';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query: string): Promise<string> => {
  return new Promise(resolve => rl.question(query, resolve));
};

const testSteps = [
  {
    category: 'Setup',
    steps: [
      'Open terminal and run: npm run web (or npm run ios)',
      'Wait for Metro bundler to start',
      'App should open in browser/simulator',
    ],
  },
  {
    category: 'Authentication',
    steps: [
      'Navigate to login screen',
      'Enter email: doremon@gmail.com',
      'Enter password: (use test password)',
      'Click Sign In',
      'Should redirect to healthcare dashboard',
    ],
  },
  {
    category: 'Healthcare Dashboard',
    steps: [
      'Verify dashboard loads without errors',
      'Check shift status card is visible',
      'Check metrics overview displays',
      'Check alert summary shows',
      'Verify hospital name displays correctly',
    ],
  },
  {
    category: 'Shift Management',
    steps: [
      'Click "Start Shift" button',
      'Verify button changes to "End Shift"',
      'Check shift timer starts counting',
      'Verify on-duty indicator turns green',
      'Click "End Shift" button',
      'Enter handover notes in modal',
      'Confirm shift ends successfully',
    ],
  },
  {
    category: 'Alert System',
    steps: [
      'Look for floating alert button (if role permits)',
      'Click to create new alert',
      'Fill in: Room Number (e.g., 205A)',
      'Select urgency level',
      'Add optional description',
      'Submit alert',
      'Verify alert appears in list',
      'Click "Acknowledge" on alert',
      'Click "Resolve" on acknowledged alert',
    ],
  },
  {
    category: 'Real-time Features',
    steps: [
      'Open app in second browser/device',
      'Login with same account',
      'Create alert in one instance',
      'Verify alert appears in other instance',
      'Check WebSocket connection indicator',
    ],
  },
];

async function runManualTestGuide() {
  console.clear();

  let totalPassed = 0;
  let totalFailed = 0;
  
  for (const section of testSteps) {

    for (let i = 0; i < section.steps.length; i++) {

      const result = await question(chalk.yellow('   Result? (p)ass / (f)ail / (s)kip: '));
      
      if (result.toLowerCase() === 'p') {

        totalPassed++;
      } else if (result.toLowerCase() === 'f') {

        const issue = await question(chalk.red('   What was the issue? '));

        totalFailed++;
      } else {

      }
    }
  }
  
  // Summary

  const passRate = totalPassed / (totalPassed + totalFailed) * 100;

  if (passRate === 100) {

  } else if (passRate >= 80) {

  } else {

  }
  
  // Save results
  const saveResults = await question(chalk.cyan('\nSave test results? (y/n): '));
  if (saveResults.toLowerCase() === 'y') {
    const filename = `test-results-${new Date().toISOString().split('T')[0]}.txt`;
    const results = `Healthcare System Test Results
Date: ${new Date().toISOString()}
Passed: ${totalPassed}
Failed: ${totalFailed}
Pass Rate: ${passRate.toFixed(1)}%
`;
    
    await Bun.write(filename, results);

  }
  
  rl.close();
}

// Run the guide
runManualTestGuide().catch(console.error);