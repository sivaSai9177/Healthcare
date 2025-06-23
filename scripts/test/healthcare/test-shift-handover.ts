#!/usr/bin/env bun
/**
 * Test script for shift handover functionality
 * Tests the complete shift handover flow from start to end
 */

import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@/src/server/routers';
import superjson from 'superjson';
import fetch from 'node-fetch';

const API_URL = process.env.API_URL || 'http://localhost:3001';

// Create authenticated client
function createAuthenticatedClient(token: string) {
  return createTRPCProxyClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${API_URL}/api/trpc`,
        fetch: fetch as any,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
    ],
    transformer: superjson,
  });
}

async function testShiftHandover() {
  console.log('🔧 Testing Shift Handover Flow...\n');

  try {
    // Step 1: Login as nurse
    console.log('1️⃣ Logging in as nurse...');
    const trpc = createTRPCProxyClient<AppRouter>({
      links: [
        httpBatchLink({
          url: `${API_URL}/api/trpc`,
          fetch: fetch as any,
        }),
      ],
      transformer: superjson,
    });

    const loginResult = await trpc.auth.login.mutate({
      email: 'nurse@test.com',
      password: 'password123',
    });

    if (!loginResult.success || !loginResult.token) {
      throw new Error('Failed to login as nurse');
    }

    const nurseClient = createAuthenticatedClient(loginResult.token);
    console.log('✅ Logged in as nurse\n');

    // Step 2: Check current shift status
    console.log('2️⃣ Checking current shift status...');
    let shiftStatus = await nurseClient.healthcare.getOnDutyStatus.query();
    console.log('Current status:', shiftStatus);

    // Step 3: Start shift if not on duty
    if (!shiftStatus.isOnDuty) {
      console.log('\n3️⃣ Starting shift...');
      const toggleResult = await nurseClient.healthcare.toggleOnDuty.mutate({
        isOnDuty: true,
      });
      console.log('Shift started:', toggleResult);
    } else {
      console.log('\n3️⃣ Already on duty');
    }

    // Step 4: Get shift summary
    console.log('\n4️⃣ Getting shift summary...');
    const shiftSummary = await nurseClient.healthcare.getShiftSummary.query();
    console.log('Shift summary:', shiftSummary);

    // Step 5: Create some test alerts (login as operator)
    console.log('\n5️⃣ Creating test alerts...');
    const operatorLogin = await trpc.auth.login.mutate({
      email: 'operator@test.com',
      password: 'password123',
    });

    if (!operatorLogin.success || !operatorLogin.token) {
      throw new Error('Failed to login as operator');
    }

    const operatorClient = createAuthenticatedClient(operatorLogin.token);
    
    // Get hospital ID
    const hospitals = await operatorClient.healthcare.getOrganizationHospitals.query({
      organizationId: loginResult.user.organizationId!,
    });
    
    const hospitalId = hospitals.hospitals[0]?.id;
    if (!hospitalId) {
      throw new Error('No hospital found');
    }

    // Create alerts
    const alert1 = await operatorClient.healthcare.createAlert.mutate({
      roomNumber: '101A',
      alertType: 'medical_emergency',
      urgencyLevel: 3,
      description: 'Patient needs immediate attention',
      hospitalId,
    });
    console.log('Created alert 1:', alert1.id);

    const alert2 = await operatorClient.healthcare.createAlert.mutate({
      roomNumber: '205B',
      alertType: 'nurse_assistance',
      urgencyLevel: 2,
      description: 'IV replacement needed',
      hospitalId,
    });
    console.log('Created alert 2:', alert2.id);

    // Step 6: End shift with handover
    console.log('\n6️⃣ Ending shift with handover...');
    const endShiftResult = await nurseClient.healthcare.endShift.mutate({
      handoverNotes: 'Patient in 101A is stable but needs hourly monitoring. IV in 205B was replaced at 2pm.',
      criticalAlerts: [alert1.id],
      followUpRequired: [
        'Check patient 101A vitals every hour',
        'Patient 205B medication due at 6pm',
      ],
    });
    console.log('Shift ended with handover:', endShiftResult);

    // Step 7: Check pending handovers (as another nurse)
    console.log('\n7️⃣ Checking pending handovers...');
    // Create another nurse account or use existing
    const nurse2Login = await trpc.auth.login.mutate({
      email: 'nurse2@test.com',
      password: 'password123',
    });

    if (nurse2Login.success && nurse2Login.token) {
      const nurse2Client = createAuthenticatedClient(nurse2Login.token);
      const pendingHandovers = await nurse2Client.healthcare.getPendingHandovers.query();
      console.log('Pending handovers:', pendingHandovers);

      // Step 8: Accept handover
      if (pendingHandovers.length > 0) {
        console.log('\n8️⃣ Accepting handover...');
        const acceptResult = await nurse2Client.healthcare.acceptHandover.mutate({
          handoverId: pendingHandovers[0].id,
          acknowledgment: 'Reviewed all notes. Beginning rounds.',
        });
        console.log('Handover accepted:', acceptResult);
      }
    }

    // Step 9: Get handover metrics
    console.log('\n9️⃣ Getting handover metrics...');
    const metrics = await nurseClient.healthcare.getHandoverMetrics.query({
      hospitalId,
      timeRange: '24h',
    });
    console.log('Handover metrics:', metrics);

    console.log('\n✅ Shift handover test completed successfully!');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testShiftHandover().catch(console.error);