#!/usr/bin/env bun
import { config } from 'dotenv';
config({ path: '.env.local' });

const BASE_URL = 'http://localhost:8081';

interface TestResult {
  endpoint: string;
  method: string;
  status: number;
  success: boolean;
  error?: string;
  data?: any;
  headers?: any;
}

interface UserCredentials {
  email: string;
  password: string;
  role: string;
}

// Test users from the setup
const TEST_USERS: UserCredentials[] = [
  { email: 'johndoe@gmail.com', password: 'test123', role: 'doctor' },
  { email: 'doremon@gmail.com', password: 'test123', role: 'nurse' },
  { email: 'johncena@gmail.com', password: 'test123', role: 'operator' },
  { email: 'saipramod273@gmail.com', password: 'test123', role: 'head_doctor' },
  { email: 'admin@test.com', password: 'test123', role: 'admin' },
  { email: 'manager@test.com', password: 'test123', role: 'manager' },
];

class FrontendIntegrationTester {
  private results: TestResult[] = [];
  private cookies: Map<string, string> = new Map();
  
  async runAllTests() {

    // Test 1: Check if server is running
    await this.testServerHealth();
    
    // Test 2: Check auth endpoints
    await this.testAuthEndpoints();
    
    // Test 3: Test login for each user
    await this.testUserLogins();
    
    // Test 4: Test protected API routes
    await this.testProtectedRoutes();
    
    // Test 5: Test navigation endpoints
    await this.testNavigationEndpoints();
    
    // Generate report
    this.generateReport();
  }
  
  private async testServerHealth() {

    // Test root endpoint
    await this.testEndpoint('GET', '/');
    
    // Test API health
    await this.testEndpoint('GET', '/api/auth/health');
    
    // Test tRPC health
    await this.testEndpoint('GET', '/api/trpc/health.check');
  }
  
  private async testAuthEndpoints() {

    // Check various auth endpoint formats
    const authEndpoints = [
      '/api/auth',
      '/api/auth/',
      '/api/auth/sign-in',
      '/api/auth/signin',
      '/api/auth/login',
      '/api/auth/session',
      '/api/auth/get-session',
    ];
    
    for (const endpoint of authEndpoints) {
      await this.testEndpoint('GET', endpoint);
      await this.testEndpoint('POST', endpoint);
    }
  }
  
  private async testUserLogins() {

    for (const user of TEST_USERS) {

      // Try different sign-in endpoints
      const signInEndpoints = [
        '/api/auth/sign-in',
        '/api/auth/signin', 
        '/api/auth/login',
        '/api/auth/sign-in/email',
      ];
      
      let loginSuccess = false;
      
      for (const endpoint of signInEndpoints) {
        const result = await this.testEndpoint('POST', endpoint, {
          email: user.email,
          password: user.password,
        });
        
        if (result.success && result.status === 200) {

          loginSuccess = true;
          
          // Store cookies for this user
          if (result.headers?.['set-cookie']) {
            this.storeCookies(user.email, result.headers['set-cookie']);
          }
          
          break;
        }
      }
      
      if (!loginSuccess) {

      }

    }
  }
  
  private async testProtectedRoutes() {

    // Test tRPC routes
    const trpcRoutes = [
      'user.me',
      'user.profile',
      'healthcare.getAlerts',
      'healthcare.getShiftStatus',
      'organization.getUserOrganizations',
      'patient.getPatients',
    ];
    
    for (const route of trpcRoutes) {
      await this.testEndpoint('GET', `/api/trpc/${route}`);
    }
  }
  
  private async testNavigationEndpoints() {

    const pages = [
      '/',
      '/login',
      '/register',
      '/home',
      '/alerts',
      '/patients',
      '/settings',
      '/dashboard',
    ];
    
    for (const page of pages) {
      await this.testEndpoint('GET', page);
    }
  }
  
  private async testEndpoint(
    method: string, 
    endpoint: string, 
    body?: any
  ): Promise<TestResult> {
    const url = `${BASE_URL}${endpoint}`;
    
    try {
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...this.getCookieHeader(),
        },
      };
      
      if (body && method !== 'GET') {
        options.body = JSON.stringify(body);
      }
      
      const response = await fetch(url, options);
      const responseText = await response.text();
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        data = responseText;
      }
      
      const result: TestResult = {
        endpoint,
        method,
        status: response.status,
        success: response.ok,
        data: data,
        headers: Object.fromEntries(response.headers.entries()),
      };
      
      this.results.push(result);
      
      // Log inline result
      const emoji = response.ok ? '✅' : '❌';

      if (!response.ok && data) {
        if (typeof data === 'string') {

        } else if (data.error) {

        }
      }
      
      return result;
    } catch (error: any) {
      const result: TestResult = {
        endpoint,
        method,
        status: 0,
        success: false,
        error: error.message,
      };
      
      this.results.push(result);

      return result;
    }
  }
  
  private storeCookies(userId: string, setCookieHeaders: string | string[]) {
    const headers = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];
    
    headers.forEach(header => {
      const match = header.match(/^([^=]+)=([^;]+)/);
      if (match) {
        this.cookies.set(match[1], match[2]);
      }
    });
  }
  
  private getCookieHeader(): Record<string, string> {
    if (this.cookies.size === 0) return {};
    
    const cookieString = Array.from(this.cookies.entries())
      .map(([key, value]) => `${key}=${value}`)
      .join('; ');
    
    return { Cookie: cookieString };
  }
  
  private generateReport() {

    const total = this.results.length;
    const successful = this.results.filter(r => r.success).length;
    const failed = total - successful;

    // Group failures by type
    const failures = this.results.filter(r => !r.success);
    
    if (failures.length > 0) {

      const failureGroups = failures.reduce((acc, f) => {
        const key = `${f.status}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(f);
        return acc;
      }, {} as Record<string, TestResult[]>);
      
      Object.entries(failureGroups).forEach(([status, fails]) => {

        fails.forEach(f => {

          if (f.error) {

          }
        });
      });
    }
    
    // Save detailed report
    const reportFile = `frontend-test-report-${new Date().toISOString().split('T')[0]}.json`;
    Bun.write(reportFile, JSON.stringify(this.results, null, 2));

    // Recommendations

    if (failures.some(f => f.endpoint.includes('/api/auth/sign-in'))) {

    }
    
    if (failures.some(f => f.status === 401)) {

    }
    
    if (failures.some(f => f.endpoint.includes('healthcare'))) {

    }
  }
}

// Run the tests
const tester = new FrontendIntegrationTester();
tester.runAllTests().catch(console.error);