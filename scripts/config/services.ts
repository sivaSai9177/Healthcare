#!/usr/bin/env bun
/**
 * Service Configuration
 * 
 * Centralized configuration for all services:
 * - Service URLs and ports
 * - Health check endpoints
 * - Service dependencies
 * - Docker service names
 */

import { config } from './environment';

// Service definitions
export const services = {
  // Core services
  api: {
    name: 'API Server',
    url: config.apiUrl,
    port: config.API_PORT,
    healthEndpoint: '/api/health',
    required: true,
  },
  
  postgres: {
    name: 'PostgreSQL',
    host: config.POSTGRES_HOST,
    port: config.POSTGRES_PORT,
    dockerService: 'postgres-local',
    required: true,
  },
  
  redis: {
    name: 'Redis',
    host: config.REDIS_HOST,
    port: config.REDIS_PORT,
    dockerService: 'redis-local',
    required: true,
  },
  
  // Application services
  websocket: {
    name: 'WebSocket Server',
    url: config.wsUrl,
    port: config.WS_PORT,
    healthEndpoint: '/health',
    dockerService: 'websocket-local',
    required: false,
  },
  
  email: {
    name: 'Email Service',
    url: `http://localhost:${config.EMAIL_PORT}`,
    port: config.EMAIL_PORT,
    healthEndpoint: '/health',
    dockerService: 'email-local',
    required: false,
    enabled: config.features.email,
  },
  
  logging: {
    name: 'Logging Service',
    url: `http://localhost:${config.LOGGING_PORT}`,
    port: config.LOGGING_PORT,
    healthEndpoint: '/health',
    dockerService: 'logging-local',
    required: false,
    enabled: config.features.logging,
  },
  
  // Analytics services
  posthog: {
    name: 'PostHog Analytics',
    url: config.POSTHOG_API_HOST || 'http://localhost:8000',
    port: 8000,
    dockerService: 'posthog-local',
    required: false,
    enabled: config.features.analytics,
  },
  
  clickhouse: {
    name: 'ClickHouse',
    host: 'localhost',
    port: 8123,
    dockerService: 'clickhouse-local',
    required: false,
    enabled: config.features.analytics,
  },
} as const;

// Service groups
export const serviceGroups = {
  core: ['postgres', 'redis'],
  app: ['api', 'websocket'],
  optional: ['email', 'logging'],
  analytics: ['posthog', 'clickhouse'],
} as const;

// Docker profiles mapping
export const dockerProfiles = {
  default: ['postgres', 'redis', 'websocket'],
  services: ['email', 'logging'],
  analytics: ['posthog', 'clickhouse'],
  tools: ['pgadmin'],
  proxy: ['nginx'],
} as const;

// Service dependency graph
export const serviceDependencies = {
  api: ['postgres', 'redis'],
  websocket: ['postgres', 'redis'],
  email: ['postgres', 'redis'],
  logging: ['postgres', 'redis'],
  posthog: ['postgres', 'redis', 'clickhouse'],
} as const;

// Health check configuration
export const healthCheckConfig = {
  timeout: 5000, // 5 seconds
  retries: 3,
  retryDelay: 1000, // 1 second
} as const;

/**
 * Get enabled services based on environment
 */
export function getEnabledServices() {
  return Object.entries(services)
    .filter(([_, service]) => service.enabled !== false)
    .map(([name, service]) => ({ name, ...service }));
}

/**
 * Get required services
 */
export function getRequiredServices() {
  return Object.entries(services)
    .filter(([_, service]) => service.required)
    .map(([name, service]) => ({ name, ...service }));
}

/**
 * Get service by name
 */
export function getService(name: keyof typeof services) {
  return services[name];
}

/**
 * Get services for a specific group
 */
export function getServiceGroup(group: keyof typeof serviceGroups) {
  return serviceGroups[group].map(name => ({
    name,
    ...services[name as keyof typeof services]
  }));
}

/**
 * Get Docker compose command for services
 */
export function getDockerCommand(
  action: 'up' | 'down' | 'logs' | 'ps',
  serviceNames?: string[]
) {
  const baseCmd = 'docker-compose -f docker-compose.local.yml';
  
  // Build profile flags
  const profiles = new Set<string>();
  if (serviceNames) {
    serviceNames.forEach(name => {
      const service = services[name as keyof typeof services];
      if (service?.dockerService) {
        // Find which profile contains this service
        Object.entries(dockerProfiles).forEach(([profile, svcs]) => {
          if (svcs.includes(service.dockerService as any)) {
            profiles.add(profile);
          }
        });
      }
    });
  }
  
  const profileFlags = Array.from(profiles)
    .filter(p => p !== 'default')
    .map(p => `--profile ${p}`)
    .join(' ');
  
  switch (action) {
    case 'up':
      return `${baseCmd} ${profileFlags} up -d ${serviceNames?.join(' ') || ''}`.trim();
    case 'down':
      return `${baseCmd} down`;
    case 'logs':
      return `${baseCmd} logs -f ${serviceNames?.join(' ') || ''}`.trim();
    case 'ps':
      return `${baseCmd} ps`;
  }
}

/**
 * Service URL builder
 */
export function buildServiceUrl(
  service: keyof typeof services,
  path = ''
): string {
  const svc = services[service];
  
  if ('url' in svc && svc.url) {
    return `${svc.url}${path}`;
  }
  
  if ('host' in svc && 'port' in svc) {
    const protocol = service === 'postgres' ? 'postgresql' : 'http';
    return `${protocol}://${svc.host}:${svc.port}${path}`;
  }
  
  throw new Error(`Cannot build URL for service: ${service}`);
}

// Export types
export type ServiceName = keyof typeof services;
export type ServiceGroup = keyof typeof serviceGroups;
export type Service = typeof services[ServiceName];