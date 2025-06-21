#!/usr/bin/env bun

async function checkApiHealth() {

  const baseUrl = 'http://localhost:8081';
  
  // Check endpoints
  const endpoints = [
    '/api/auth',
    '/api/trpc/auth.getSession?batch=1&input=%7B%7D',
    '/'
  ];
  
  for (const endpoint of endpoints) {
    try {

      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: endpoint.includes('trpc') ? 'GET' : 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (endpoint === '/api/auth') {
        const text = await response.text();

      }
    } catch (error) {

    }

  }
  
  // Check if server is running
  try {
    const response = await fetch(baseUrl);
    if (response.ok) {

    }
  } catch (error) {

  }
}

checkApiHealth();