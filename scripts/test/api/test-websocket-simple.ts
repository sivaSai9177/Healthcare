#!/usr/bin/env bun

/**
 * Simple WebSocket Connectivity Test
 * Tests basic WebSocket connection and message exchange
 */

import WebSocket from 'ws';

const WS_URL = process.env.WS_URL || 'ws://localhost:3002/api/trpc';
const HOSPITAL_ID = 'f155b026-01bd-4212-94f3-e7aedef2801d'; // Dubai Central Hospital

async function testWebSocketConnection() {

  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL, {
      headers: {
        'User-Agent': 'WebSocket-Test-Client',
      },
    });
    
    let pingInterval: NodeJS.Timeout;
    let messageCount = 0;
    const startTime = Date.now();
    
    ws.on('open', () => {

      // Send initial connection message
      const initMessage = {
        type: 'connection_init',
        payload: {},
      };

      ws.send(JSON.stringify(initMessage));
      
      // Set up ping interval
      pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          const pingMessage = {
            id: Date.now(),
            type: 'ping',
          };

          ws.send(JSON.stringify(pingMessage));
        }
      }, 5000);
      
      // Test subscription after connection
      setTimeout(() => {

        const subscriptionMessage = {
          id: 1,
          method: 'subscription',
          params: {
            path: 'healthcare.subscribeToAlerts',
            input: {
              hospitalId: HOSPITAL_ID,
            },
          },
        };
        
        ws.send(JSON.stringify(subscriptionMessage));
      }, 1000);
    });
    
    ws.on('message', (data) => {
      messageCount++;
      try {
        const message = JSON.parse(data.toString());

        if (message.type === 'connection_ack') {

        } else if (message.type === 'pong') {

        } else if (message.result?.type === 'started') {

        } else if (message.result?.type === 'data') {

        } else {

        }
        
        // After receiving some messages, close the connection
        if (messageCount >= 5) {

          clearInterval(pingInterval);
          ws.close();
        }
      } catch (error) {
        console.error('❌ Error parsing message:', error);

      }
    });
    
    ws.on('error', (error) => {
      console.error('\n❌ WebSocket error:', error.message);
      clearInterval(pingInterval);
      reject(error);
    });
    
    ws.on('close', (code, reason) => {

      clearInterval(pingInterval);
      resolve(undefined);
    });
    
    // Timeout after 30 seconds
    setTimeout(() => {
      if (ws.readyState === WebSocket.OPEN) {

        clearInterval(pingInterval);
        ws.close();
      }
    }, 30000);
  });
}

// Run the test
testWebSocketConnection()
  .then(() => {

    process.exit(0);
  })
  .catch((error) => {
    console.error('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('\n❌ WebSocket test failed:', error);
    process.exit(1);
  });