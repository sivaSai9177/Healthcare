#!/usr/bin/env bun
/**
 * Security Audit Script for Healthcare Alert System
 * Performs comprehensive security checks on the application
 */

import chalk from 'chalk';
import { execSync } from 'child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import fetch from 'node-fetch';

// Simple logger
const log = {
  info: (msg: string) => console.log(msg),
  success: (msg: string) => console.log(msg),
  error: (msg: string) => console.log(msg),
  warn: (msg: string) => console.log(msg),
  debug: (msg: string) => process.env.DEBUG && console.log(msg),
};

interface SecurityIssue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  issue: string;
  description: string;
  file?: string;
  line?: number;
  recommendation: string;
}

interface AuditReport {
  timestamp: Date;
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
  };
  issues: SecurityIssue[];
  checks: {
    dependencies: boolean;
    secrets: boolean;
    headers: boolean;
    authentication: boolean;
    authorization: boolean;
    input_validation: boolean;
    file_permissions: boolean;
    docker: boolean;
  };
}

const issues: SecurityIssue[] = [];
const auditChecks = {
  dependencies: false,
  secrets: false,
  headers: false,
  authentication: false,
  authorization: false,
  input_validation: false,
  file_permissions: false,
  docker: false,
};

// Check for dependency vulnerabilities
async function checkDependencies() {

  try {
    // Run npm audit
    const auditResult = execSync('npm audit --json', { encoding: 'utf8' });
    const audit = JSON.parse(auditResult);
    
    if (audit.metadata.vulnerabilities) {
      const vulns = audit.metadata.vulnerabilities;
      
      if (vulns.critical > 0) {
        issues.push({
          severity: 'critical',
          category: 'Dependencies',
          issue: 'Critical vulnerabilities in dependencies',
          description: `Found ${vulns.critical} critical vulnerabilities`,
          recommendation: 'Run "npm audit fix" or update dependencies manually',
        });
      }
      
      if (vulns.high > 0) {
        issues.push({
          severity: 'high',
          category: 'Dependencies',
          issue: 'High severity vulnerabilities',
          description: `Found ${vulns.high} high severity vulnerabilities`,
          recommendation: 'Review and update affected packages',
        });
      }
      
      log.warn(`Found ${vulns.total} vulnerabilities (${vulns.critical} critical, ${vulns.high} high)`);
    } else {
      log.success('No known vulnerabilities in dependencies');
    }
    
    auditChecks.dependencies = true;
  } catch (error) {
    // npm audit returns non-zero exit code if vulnerabilities found
    log.warn('Dependency audit completed with findings');
    auditChecks.dependencies = true;
  }
  
  // Check for outdated packages
  try {
    execSync('npm outdated', { stdio: 'ignore' });
  } catch {
    log.info('Some packages are outdated. Consider updating.');
  }
}

// Check for secrets in code
async function checkSecrets() {

  const secretPatterns = [
    { pattern: /api[_-]?key\s*[:=]\s*["'][^"']{20,}/gi, name: 'API Key' },
    { pattern: /secret[_-]?key\s*[:=]\s*["'][^"']{20,}/gi, name: 'Secret Key' },
    { pattern: /password\s*[:=]\s*["'][^"']+/gi, name: 'Hardcoded Password' },
    { pattern: /private[_-]?key\s*[:=]\s*["'][^"']+/gi, name: 'Private Key' },
    { pattern: /token\s*[:=]\s*["'][^"']{20,}/gi, name: 'Token' },
    { pattern: /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----/g, name: 'Private Key File' },
  ];
  
  const filesToCheck = [
    'src/**/*.ts',
    'src/**/*.tsx',
    'components/**/*.tsx',
    'app/**/*.tsx',
    'lib/**/*.ts',
  ];
  
  let secretsFound = 0;
  
  function scanFile(filePath: string) {
    if (!existsSync(filePath)) return;
    
    const content = readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    for (const { pattern, name } of secretPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          // Skip if it's likely a placeholder
          if (match.includes('your-') || match.includes('example') || match.includes('xxx')) {
            return;
          }
          
          const lineNumber = lines.findIndex(line => line.includes(match)) + 1;
          
          issues.push({
            severity: 'critical',
            category: 'Secrets',
            issue: `Potential ${name} exposed`,
            description: `Found potential ${name} in source code`,
            file: filePath,
            line: lineNumber,
            recommendation: 'Move secrets to environment variables',
          });
          
          secretsFound++;
        });
      }
    }
  }
  
  // Scan source files
  function scanDirectory(dir: string) {
    if (!existsSync(dir)) return;
    
    const files = readdirSync(dir);
    for (const file of files) {
      const fullPath = join(dir, file);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        scanDirectory(fullPath);
      } else if (stat.isFile() && (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js'))) {
        scanFile(fullPath);
      }
    }
  }
  
  scanDirectory('src');
  scanDirectory('components');
  scanDirectory('app');
  scanDirectory('lib');
  
  if (secretsFound === 0) {
    log.success('No hardcoded secrets found');
  } else {
    log.error(`Found ${secretsFound} potential secrets in code`);
  }
  
  // Check .env files
  const envFiles = ['.env', '.env.local', '.env.production'];
  for (const envFile of envFiles) {
    if (existsSync(envFile)) {
      // Check if it's in .gitignore
      const gitignore = readFileSync('.gitignore', 'utf8');
      if (!gitignore.includes(envFile)) {
        issues.push({
          severity: 'critical',
          category: 'Secrets',
          issue: 'Environment file not in .gitignore',
          description: `${envFile} might be committed to repository`,
          file: envFile,
          recommendation: `Add ${envFile} to .gitignore`,
        });
      }
    }
  }
  
  auditChecks.secrets = true;
}

// Check security headers
async function checkSecurityHeaders() {

  const targetUrl = process.env.AUDIT_URL || 'http://localhost:8081';
  
  try {
    const response = await fetch(targetUrl);
    const headers = response.headers;
    
    // Check for required security headers
    const requiredHeaders = [
      { name: 'X-Content-Type-Options', expected: 'nosniff' },
      { name: 'X-Frame-Options', expected: 'DENY' },
      { name: 'X-XSS-Protection', expected: '1; mode=block' },
      { name: 'Strict-Transport-Security', expected: 'max-age=31536000' },
      { name: 'Content-Security-Policy', expected: null }, // Just check existence
    ];
    
    for (const { name, expected } of requiredHeaders) {
      const value = headers.get(name.toLowerCase());
      
      if (!value) {
        issues.push({
          severity: 'high',
          category: 'Security Headers',
          issue: `Missing ${name} header`,
          description: `Security header ${name} is not set`,
          recommendation: `Add ${name} header to responses`,
        });
      } else if (expected && value !== expected) {
        issues.push({
          severity: 'medium',
          category: 'Security Headers',
          issue: `Incorrect ${name} header`,
          description: `${name} is set to "${value}", expected "${expected}"`,
          recommendation: `Update ${name} header to recommended value`,
        });
      } else {
        log.success(`${name} header is properly set`);
      }
    }
    
    auditChecks.headers = true;
  } catch (error) {
    log.warn(`Could not check headers: ${error.message}`);
    log.info('Make sure the application is running');
  }
}

// Check authentication implementation
async function checkAuthentication() {

  // Check password requirements
  const authFiles = [
    'src/server/routers/auth.ts',
    'lib/auth/auth-server.ts',
    'lib/validations/server.ts',
  ];
  
  for (const file of authFiles) {
    if (existsSync(file)) {
      const content = readFileSync(file, 'utf8');
      
      // Check for password validation
      if (!content.includes('password') || !content.match(/min.*8|length.*8/)) {
        issues.push({
          severity: 'high',
          category: 'Authentication',
          issue: 'Weak password requirements',
          description: 'Password minimum length might be too short',
          file,
          recommendation: 'Enforce minimum 8 characters with complexity requirements',
        });
      }
      
      // Check for rate limiting
      if (!content.includes('rateLimit') && !content.includes('rate-limit')) {
        issues.push({
          severity: 'high',
          category: 'Authentication',
          issue: 'No rate limiting on auth endpoints',
          description: 'Authentication endpoints are vulnerable to brute force',
          file,
          recommendation: 'Implement rate limiting on login attempts',
        });
      }
    }
  }
  
  // Check session configuration
  if (existsSync('lib/auth/auth-server.ts')) {
    const authConfig = readFileSync('lib/auth/auth-server.ts', 'utf8');
    
    if (!authConfig.includes('httpOnly')) {
      issues.push({
        severity: 'high',
        category: 'Authentication',
        issue: 'Session cookies not httpOnly',
        description: 'Session cookies might be accessible via JavaScript',
        file: 'lib/auth/auth-server.ts',
        recommendation: 'Set httpOnly flag on session cookies',
      });
    }
    
    if (!authConfig.includes('secure') && !authConfig.includes('sameSite')) {
      issues.push({
        severity: 'medium',
        category: 'Authentication',
        issue: 'Session cookie security flags',
        description: 'Session cookies should have secure and sameSite flags',
        file: 'lib/auth/auth-server.ts',
        recommendation: 'Set secure and sameSite flags on cookies',
      });
    }
  }
  
  log.success('Authentication checks completed');
  auditChecks.authentication = true;
}

// Check authorization implementation
async function checkAuthorization() {

  // Check for authorization middleware
  const routerFiles = readdirSync('src/server/routers').filter(f => f.endsWith('.ts'));
  
  for (const file of routerFiles) {
    const content = readFileSync(join('src/server/routers', file), 'utf8');
    
    // Check if sensitive routes have auth checks
    if (content.includes('create') || content.includes('update') || content.includes('delete')) {
      if (!content.includes('protectedProcedure') && !content.includes('requireAuth')) {
        issues.push({
          severity: 'critical',
          category: 'Authorization',
          issue: 'Unprotected mutation endpoints',
          description: `Router ${file} has mutations without auth checks`,
          file: `src/server/routers/${file}`,
          recommendation: 'Use protectedProcedure for all mutations',
        });
      }
    }
  }
  
  // Check for proper role checks
  if (existsSync('lib/auth/permissions.ts')) {
    log.success('Permission system implemented');
  } else {
    issues.push({
      severity: 'medium',
      category: 'Authorization',
      issue: 'No centralized permission system',
      description: 'Role-based access control should be centralized',
      recommendation: 'Implement centralized permission checking',
    });
  }
  
  auditChecks.authorization = true;
}

// Check input validation
async function checkInputValidation() {

  // Check for SQL injection protection
  const dbFiles = [
    'src/db/index.ts',
    'src/server/routers/healthcare.ts',
    'src/server/routers/patient.ts',
  ];
  
  for (const file of dbFiles) {
    if (existsSync(file)) {
      const content = readFileSync(file, 'utf8');
      
      // Check for raw SQL queries
      if (content.includes('db.execute') && content.includes('${')) {
        issues.push({
          severity: 'critical',
          category: 'Input Validation',
          issue: 'Potential SQL injection',
          description: 'Found string interpolation in SQL queries',
          file,
          recommendation: 'Use parameterized queries only',
        });
      }
      
      // Check for input sanitization
      if (!content.includes('z.') && !content.includes('zod')) {
        issues.push({
          severity: 'high',
          category: 'Input Validation',
          issue: 'Missing input validation',
          description: 'No schema validation found',
          file,
          recommendation: 'Use Zod for input validation',
        });
      }
    }
  }
  
  // Check for XSS protection
  const componentFiles = readdirSync('components', { recursive: true })
    .filter(f => f.toString().endsWith('.tsx'));
  
  let dangerouslySetInnerHTML = 0;
  for (const file of componentFiles) {
    const content = readFileSync(join('components', file.toString()), 'utf8');
    if (content.includes('dangerouslySetInnerHTML')) {
      dangerouslySetInnerHTML++;
    }
  }
  
  if (dangerouslySetInnerHTML > 0) {
    issues.push({
      severity: 'high',
      category: 'Input Validation',
      issue: 'Potential XSS vulnerability',
      description: `Found ${dangerouslySetInnerHTML} uses of dangerouslySetInnerHTML`,
      recommendation: 'Sanitize HTML content or use safe alternatives',
    });
  }
  
  log.success('Input validation checks completed');
  auditChecks.input_validation = true;
}

// Check file permissions
async function checkFilePermissions() {

  // Check for sensitive files with wrong permissions
  const sensitiveFiles = [
    '.env',
    '.env.local',
    '.env.production',
    'credentials.json',
    '.kamal/secrets',
  ];
  
  for (const file of sensitiveFiles) {
    if (existsSync(file)) {
      try {
        const stats = statSync(file);
        const mode = (stats.mode & parseInt('777', 8)).toString(8);
        
        if (mode !== '600' && mode !== '400') {
          issues.push({
            severity: 'high',
            category: 'File Permissions',
            issue: 'Insecure file permissions',
            description: `${file} has permissions ${mode}, should be 600`,
            file,
            recommendation: `Run: chmod 600 ${file}`,
          });
        } else {
          log.success(`${file} has secure permissions`);
        }
      } catch (error) {
        log.debug(`Could not check permissions for ${file}`);
      }
    }
  }
  
  auditChecks.file_permissions = true;
}

// Check Docker security
async function checkDockerSecurity() {

  if (existsSync('Dockerfile.production')) {
    const dockerfile = readFileSync('Dockerfile.production', 'utf8');
    
    // Check for running as root
    if (!dockerfile.includes('USER') || dockerfile.includes('USER root')) {
      issues.push({
        severity: 'high',
        category: 'Docker',
        issue: 'Container runs as root',
        description: 'Docker container should run as non-root user',
        file: 'Dockerfile.production',
        recommendation: 'Add USER directive to run as non-root',
      });
    }
    
    // Check for latest tags
    if (dockerfile.includes(':latest')) {
      issues.push({
        severity: 'medium',
        category: 'Docker',
        issue: 'Using latest tags',
        description: 'Docker images should use specific versions',
        file: 'Dockerfile.production',
        recommendation: 'Pin all image versions',
      });
    }
    
    // Check for COPY instead of ADD
    if (dockerfile.includes('ADD') && !dockerfile.includes('ADD http')) {
      issues.push({
        severity: 'low',
        category: 'Docker',
        issue: 'Using ADD instead of COPY',
        description: 'COPY is preferred over ADD for local files',
        file: 'Dockerfile.production',
        recommendation: 'Replace ADD with COPY',
      });
    }
    
    log.success('Docker security checks completed');
  } else {
    log.warn('Dockerfile.production not found');
  }
  
  auditChecks.docker = true;
}

// Generate security report
function generateReport(): AuditReport {
  const summary = {
    critical: issues.filter(i => i.severity === 'critical').length,
    high: issues.filter(i => i.severity === 'high').length,
    medium: issues.filter(i => i.severity === 'medium').length,
    low: issues.filter(i => i.severity === 'low').length,
    total: issues.length,
  };
  
  return {
    timestamp: new Date(),
    summary,
    issues: issues.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    }),
    checks: auditChecks,
  };
}

// Display report
function displayReport(report: AuditReport) {

  // Summary

  // Display issues by severity
  if (report.summary.critical > 0) {

    report.issues.filter(i => i.severity === 'critical').forEach(issue => {

      if (issue.file) /* console.log(`  File: ${issue.file}${issue.line ? `:${issue.line}` : ''}`) */;

    });
  }
  
  if (report.summary.high > 0) {

    report.issues.filter(i => i.severity === 'high').forEach(issue => {

      if (issue.file) /* console.log(`  File: ${issue.file}${issue.line ? `:${issue.line}` : ''}`) */;

    });
  }
  
  if (report.summary.medium > 0) {

    report.issues.filter(i => i.severity === 'medium').forEach(issue => {

    });
  }
  
  if (report.summary.low > 0) {

    report.issues.filter(i => i.severity === 'low').forEach(issue => {

    });
  }
  
  // Overall assessment

  if (report.summary.critical > 0) {

  } else if (report.summary.high > 0) {

  } else if (report.summary.medium > 0) {

  } else {

  }
  
  // Save report
  const filename = `security-audit-${new Date().toISOString().replace(/:/g, '-')}.json`;
  require('fs').writeFileSync(filename, JSON.stringify(report, null, 2));

}

// Main execution
async function main() {

  // Run all security checks
  await checkDependencies();
  await checkSecrets();
  await checkSecurityHeaders();
  await checkAuthentication();
  await checkAuthorization();
  await checkInputValidation();
  await checkFilePermissions();
  await checkDockerSecurity();
  
  // Generate and display report
  const report = generateReport();
  displayReport(report);
  
  // Exit with error code if critical issues found
  if (report.summary.critical > 0) {
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  log.error(`Security audit failed: ${error}`);
  process.exit(1);
});