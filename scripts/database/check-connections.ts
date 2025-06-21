#!/usr/bin/env bun
import { Pool } from 'pg';
import { log } from '@/lib/core/debug/logger';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://myexpo:myexpo123@localhost:5432/myexpo_dev';

async function checkConnections() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: false,
  });

  try {
    // Check current connections
    const result = await pool.query(`
      SELECT 
        pid,
        usename,
        application_name,
        client_addr,
        state,
        state_change,
        query_start,
        NOW() - state_change as idle_time
      FROM pg_stat_activity
      WHERE datname = current_database()
      ORDER BY state_change DESC;
    `);

    console.log('\n=== Current Database Connections ===');
    console.log(`Total connections: ${result.rows.length}`);
    
    // Group by state
    const byState = result.rows.reduce((acc, row) => {
      acc[row.state] = (acc[row.state] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('\nConnections by state:');
    Object.entries(byState).forEach(([state, count]) => {
      console.log(`  ${state}: ${count}`);
    });

    // Show idle connections
    const idleConnections = result.rows.filter(row => row.state === 'idle' && row.idle_time);
    if (idleConnections.length > 0) {
      console.log('\nIdle connections:');
      idleConnections.forEach(conn => {
        console.log(`  PID ${conn.pid}: idle for ${conn.idle_time}, app: ${conn.application_name}`);
      });
    }

    // Kill old idle connections (optional)
    const killOldConnections = process.argv.includes('--kill-idle');
    if (killOldConnections) {
      const oldIdleConnections = result.rows.filter(row => {
        if (row.state !== 'idle' || !row.idle_time) return false;
        const idleMinutes = parseInt(row.idle_time.split(':')[1] || '0');
        return idleMinutes > 5; // Kill connections idle for more than 5 minutes
      });

      if (oldIdleConnections.length > 0) {
        console.log(`\nKilling ${oldIdleConnections.length} old idle connections...`);
        for (const conn of oldIdleConnections) {
          try {
            await pool.query('SELECT pg_terminate_backend($1)', [conn.pid]);
            console.log(`  Killed PID ${conn.pid}`);
          } catch (err) {
            console.error(`  Failed to kill PID ${conn.pid}:`, err.message);
          }
        }
      }
    }

    // Check max connections setting
    const maxConnResult = await pool.query('SHOW max_connections');
    console.log(`\nMax connections allowed: ${maxConnResult.rows[0].max_connections}`);

  } catch (error) {
    console.error('Error checking connections:', error);
  } finally {
    await pool.end();
  }
}

// Run the check
checkConnections().catch(console.error);