#!/usr/bin/env bun
/**
 * Test Analytics Data Script
 * Verifies that the seeded data creates proper analytics
 */

import { db } from '@/src/db';
import { alerts, alertAcknowledgments, healthcareAuditLogs } from '@/src/db/healthcare-schema';
import { sql } from 'drizzle-orm';
import { format, subDays } from 'date-fns';

async function testAnalyticsData() {

  // Test 1: Alert distribution by urgency level

  const alertsByUrgency = await db
    .select({
      urgencyLevel: alerts.urgencyLevel,
      count: sql<number>`count(*)`,
    })
    .from(alerts)
    .groupBy(alerts.urgencyLevel)
    .orderBy(alerts.urgencyLevel);
  
  alertsByUrgency.forEach(row => {

  });

  // Test 2: Response times by urgency level

  const responseTimes = await db
    .select({
      urgencyLevel: alerts.urgencyLevel,
      avgResponseTime: sql<number>`avg(EXTRACT(EPOCH FROM (acknowledged_at - created_at)) / 60)`,
      minResponseTime: sql<number>`min(EXTRACT(EPOCH FROM (acknowledged_at - created_at)) / 60)`,
      maxResponseTime: sql<number>`max(EXTRACT(EPOCH FROM (acknowledged_at - created_at)) / 60)`,
    })
    .from(alerts)
    .where(sql`acknowledged_at IS NOT NULL`)
    .groupBy(alerts.urgencyLevel)
    .orderBy(alerts.urgencyLevel);

  responseTimes.forEach(row => {
    const avg = Number(row.avgResponseTime) || 0;
    const min = Number(row.minResponseTime) || 0;
    const max = Number(row.maxResponseTime) || 0;

  });

  // Test 3: Alerts per day (last 7 days)

  const alertsPerDay = await db
    .select({
      date: sql<string>`DATE(created_at)`,
      count: sql<number>`count(*)`,
      avgResponseTime: sql<number>`avg(EXTRACT(EPOCH FROM (acknowledged_at - created_at)) / 60)`,
    })
    .from(alerts)
    .where(sql`created_at >= ${subDays(new Date(), 7)}`)
    .groupBy(sql`DATE(created_at)`)
    .orderBy(sql`DATE(created_at) DESC`);

  alertsPerDay.forEach(row => {
    const avgResponse = Number(row.avgResponseTime) || 0;

  });

  // Test 4: Alert type distribution

  const alertTypes = await db
    .select({
      alertType: alerts.alertType,
      count: sql<number>`count(*)`,
      percentage: sql<number>`(count(*) * 100.0 / (SELECT count(*) FROM alerts))`,
    })
    .from(alerts)
    .groupBy(alerts.alertType)
    .orderBy(sql`count(*) DESC`);

  alertTypes.forEach(row => {
    const percentage = Number(row.percentage) || 0;

  });

  // Test 5: Activity log distribution by severity

  const logsBySeverity = await db
    .select({
      severity: healthcareAuditLogs.severity,
      count: sql<number>`count(*)`,
    })
    .from(healthcareAuditLogs)
    .groupBy(healthcareAuditLogs.severity)
    .orderBy(sql`
      CASE severity 
        WHEN 'critical' THEN 1
        WHEN 'error' THEN 2
        WHEN 'warning' THEN 3
        WHEN 'info' THEN 4
      END
    `);

  logsBySeverity.forEach(row => {

  });

  // Test 6: Hourly activity pattern

  const hourlyActivity = await db
    .select({
      hour: sql<number>`EXTRACT(HOUR FROM timestamp)`,
      count: sql<number>`count(*)`,
    })
    .from(healthcareAuditLogs)
    .where(sql`timestamp >= NOW() - INTERVAL '24 hours'`)
    .groupBy(sql`EXTRACT(HOUR FROM timestamp)`)
    .orderBy(sql`EXTRACT(HOUR FROM timestamp)`);

  const maxCount = Math.max(...hourlyActivity.map(h => h.count));
  hourlyActivity.forEach(row => {
    const barLength = Math.floor((row.count / maxCount) * 30);
    const bar = '█'.repeat(barLength);

  });

}

// Run the test
testAnalyticsData().catch(console.error);