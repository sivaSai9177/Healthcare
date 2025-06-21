#!/usr/bin/env tsx
import { exit } from 'process';

async function testHealthcareRegistration() {

  const testCases = [
    {
      email: 'test-doctor@example.com',
      password: 'TestPassword123!',
      name: 'Test Doctor',
      role: 'doctor',
      organizationCode: 'HOSP2024',
      expectProfileCompletion: true
    },
    {
      email: 'test-nurse@example.com', 
      password: 'TestPassword123!',
      name: 'Test Nurse',
      role: 'nurse',
      organizationCode: '', // No org code
      expectProfileCompletion: true
    },
    {
      email: 'test-user@example.com',
      password: 'TestPassword123!', 
      name: 'Test User',
      role: 'user',
      organizationCode: '',
      expectProfileCompletion: false
    }
  ];
  
  const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8081';
  
  for (const testCase of testCases) {

    try {
      const response = await fetch(`${API_URL}/api/trpc/auth.signUp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          json: {
            email: testCase.email,
            password: testCase.password,
            name: testCase.name,
            role: testCase.role,
            organizationCode: testCase.organizationCode,
            acceptTerms: true,
            acceptPrivacy: true
          }
        })
      });
      
      const data = await response.json();
      
      if (data.result?.data?.json?.success) {
        const user = data.result.data.json.user;

        if (user.needsProfileCompletion !== testCase.expectProfileCompletion) {

        }
      } else {

      }
    } catch (error) {

    }
  }

}

// Run the test
testHealthcareRegistration()
  .then(() => {

    exit(0);
  })
  .catch(error => {
    console.error('\nTest failed:', error);
    exit(1);
  });