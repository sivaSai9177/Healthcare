#!/usr/bin/env bun
/**
 * Docker Utilities
 * 
 * Helper functions for Docker operations:
 * - Container management
 * - Health checks
 * - Log streaming
 * - Service orchestration
 */

import { execSync, spawn } from 'child_process';
import { logger } from './logger';
import { ConnectionError } from './error-handler';
import { services, getDockerCommand } from '../config/services';
import { withSpinner } from './cli-utils';

interface DockerContainer {
  id: string;
  name: string;
  image: string;
  status: string;
  ports: string[];
  created: string;
}

/**
 * Check if Docker is running
 */
export async function checkDocker(): Promise<boolean> {
  try {
    execSync('docker info', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Ensure Docker is available
 */
export async function ensureDocker(): Promise<void> {
  if (!await checkDocker()) {
    throw new ConnectionError(
      'Docker is not running. Please start Docker Desktop and try again.'
    );
  }
}

/**
 * Get container status
 */
export function getContainer(name: string): DockerContainer | null {
  try {
    const output = execSync(
      `docker ps -a --filter "name=${name}" --format json`,
      { encoding: 'utf-8' }
    );
    
    if (!output.trim()) return null;
    
    const container = JSON.parse(output.split('\n')[0]);
    
    return {
      id: container.ID,
      name: container.Names,
      image: container.Image,
      status: container.Status,
      ports: container.Ports ? container.Ports.split(', ') : [],
      created: container.CreatedAt,
    };
  } catch {
    return null;
  }
}

/**
 * Check if container is running
 */
export function isContainerRunning(name: string): boolean {
  const container = getContainer(name);
  return container ? container.status.includes('Up') : false;
}

/**
 * Start Docker services
 */
export async function startServices(
  serviceNames?: string[],
  options: {
    detached?: boolean;
    build?: boolean;
    recreate?: boolean;
  } = {}
): Promise<void> {
  await ensureDocker();
  
  const { detached = true, build = false, recreate = false } = options;
  
  let command = getDockerCommand('up', serviceNames);
  
  if (!detached) {
    command = command.replace(' -d', '');
  }
  
  if (build) {
    command += ' --build';
  }
  
  if (recreate) {
    command += ' --force-recreate';
  }
  
  logger.info(`Starting services: ${serviceNames?.join(', ') || 'all'}`);
  
  await withSpinner('Starting Docker services', async () => {
    execSync(command, { stdio: 'inherit' });
  });
}

/**
 * Stop Docker services
 */
export async function stopServices(serviceNames?: string[]): Promise<void> {
  await ensureDocker();
  
  const command = getDockerCommand('down', serviceNames);
  
  logger.info(`Stopping services: ${serviceNames?.join(', ') || 'all'}`);
  
  await withSpinner('Stopping Docker services', async () => {
    execSync(command, { stdio: 'inherit' });
  });
}

/**
 * Restart Docker services
 */
export async function restartServices(serviceNames?: string[]): Promise<void> {
  await stopServices(serviceNames);
  await startServices(serviceNames);
}

/**
 * Get service logs
 */
export function streamLogs(
  serviceNames?: string[],
  options: {
    follow?: boolean;
    tail?: number;
    timestamps?: boolean;
  } = {}
): void {
  const { follow = true, tail, timestamps = false } = options;
  
  let command = getDockerCommand('logs', serviceNames);
  
  if (follow) {
    command += ' -f';
  }
  
  if (tail) {
    command += ` --tail ${tail}`;
  }
  
  if (timestamps) {
    command += ' -t';
  }
  
  const child = spawn('sh', ['-c', command], {
    stdio: 'inherit'
  });
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    child.kill('SIGINT');
    process.exit(0);
  });
}

/**
 * Execute command in container
 */
export function execInContainer(
  containerName: string,
  command: string[],
  options: {
    interactive?: boolean;
    tty?: boolean;
    user?: string;
    workdir?: string;
  } = {}
): string {
  const { interactive = false, tty = false, user, workdir } = options;
  
  let dockerCommand = 'docker exec';
  
  if (interactive) dockerCommand += ' -i';
  if (tty) dockerCommand += ' -t';
  if (user) dockerCommand += ` -u ${user}`;
  if (workdir) dockerCommand += ` -w ${workdir}`;
  
  dockerCommand += ` ${containerName} ${command.join(' ')}`;
  
  return execSync(dockerCommand, { encoding: 'utf-8' }).trim();
}

/**
 * Wait for container to be healthy
 */
export async function waitForHealthy(
  containerName: string,
  maxRetries: number = 30,
  retryDelay: number = 1000
): Promise<void> {
  logger.info(`Waiting for ${containerName} to be healthy...`);
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const output = execSync(
        `docker inspect --format='{{.State.Health.Status}}' ${containerName}`,
        { encoding: 'utf-8' }
      ).trim();
      
      if (output === 'healthy') {
        logger.success(`${containerName} is healthy`);
        return;
      }
      
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    } catch {
      // Container might not exist yet
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }
  
  throw new ConnectionError(`${containerName} failed to become healthy`);
}

/**
 * Wait for port to be available
 */
export async function waitForPort(
  port: number,
  host: string = 'localhost',
  maxRetries: number = 30,
  retryDelay: number = 1000
): Promise<void> {
  const { createConnection } = await import('net');
  
  logger.info(`Waiting for ${host}:${port} to be available...`);
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      await new Promise<void>((resolve, reject) => {
        const socket = createConnection({ port, host }, () => {
          socket.end();
          resolve();
        });
        
        socket.on('error', reject);
        socket.setTimeout(1000);
      });
      
      logger.success(`${host}:${port} is available`);
      return;
    } catch {
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }
  
  throw new ConnectionError(`${host}:${port} failed to become available`);
}

/**
 * Clean Docker resources
 */
export async function cleanDocker(options: {
  volumes?: boolean;
  images?: boolean;
  all?: boolean;
} = {}): Promise<void> {
  const { volumes = false, images = false, all = false } = options;
  
  await ensureDocker();
  
  logger.info('Cleaning Docker resources...');
  
  // Stop all containers if requested
  if (all) {
    try {
      execSync('docker stop $(docker ps -q)', { stdio: 'ignore' });
    } catch {
      // No containers running
    }
  }
  
  // Remove stopped containers
  try {
    execSync('docker container prune -f', { stdio: 'inherit' });
  } catch {
    logger.warn('Failed to prune containers');
  }
  
  // Remove volumes if requested
  if (volumes || all) {
    try {
      execSync('docker volume prune -f', { stdio: 'inherit' });
    } catch {
      logger.warn('Failed to prune volumes');
    }
  }
  
  // Remove images if requested
  if (images || all) {
    try {
      execSync('docker image prune -a -f', { stdio: 'inherit' });
    } catch {
      logger.warn('Failed to prune images');
    }
  }
  
  logger.success('Docker cleanup complete');
}

/**
 * Get Docker compose status
 */
export function getComposeStatus(): {
  service: string;
  state: string;
  ports: string[];
}[] {
  try {
    const output = execSync(
      getDockerCommand('ps'),
      { encoding: 'utf-8' }
    );
    
    const lines = output.split('\n').slice(1).filter(Boolean);
    
    return lines.map(line => {
      const parts = line.trim().split(/\s{2,}/);
      return {
        service: parts[0],
        state: parts[2],
        ports: parts[3] ? parts[3].split(', ') : [],
      };
    });
  } catch {
    return [];
  }
}

/**
 * Check if all required services are running
 */
export async function checkRequiredServices(): Promise<{
  healthy: boolean;
  services: {
    name: string;
    running: boolean;
    error?: string;
  }[];
}> {
  const requiredServices = Object.entries(services)
    .filter(([_, service]) => service.required)
    .map(([name, service]) => ({
      name,
      dockerService: service.dockerService
    }));
  
  const results = requiredServices.map(service => {
    if (!service.dockerService) {
      return {
        name: service.name,
        running: true, // Assume non-Docker services are running
      };
    }
    
    const running = isContainerRunning(service.dockerService);
    
    return {
      name: service.name,
      running,
      error: running ? undefined : 'Container not running',
    };
  });
  
  return {
    healthy: results.every(r => r.running),
    services: results,
  };
}