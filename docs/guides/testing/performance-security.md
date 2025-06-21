# Performance and Security Testing Guide

This guide covers load testing and security auditing for the Healthcare Alert System.

## 🚀 Load Testing

### Overview
Load testing ensures the system can handle expected user traffic and identifies performance bottlenecks.

### Quick Start
```bash
# Basic load test (60 seconds, 10 users)
bun scripts/testing/load-test.ts

# Custom configuration
bun scripts/testing/load-test.ts --url=https://staging.example.com --users=50 --duration=300
```

### Configuration Options
- `--url`: Target URL (default: http://localhost:8081)
- `--duration`: Test duration in seconds (default: 60)
- `--users`: Number of concurrent users (default: 10)

### Test Scenarios
The load test simulates real user behavior with weighted scenarios:

1. **Browse Alerts (40%)** - Users browsing alert lists
2. **Create Alert (30%)** - Nurses creating new alerts
3. **Dashboard Load (20%)** - Doctors viewing dashboards
4. **Health Check (10%)** - System monitoring

### Performance Targets
- **Response Time**: P95 < 1 second
- **Throughput**: > 100 requests/second
- **Error Rate**: < 1%
- **Concurrent Users**: Support 100+ simultaneous users

### Interpreting Results
```json
{
  "summary": {
    "totalRequests": 5420,
    "successfulRequests": 5385,
    "failedRequests": 35,
    "averageResponseTime": 234.5,
    "requestsPerSecond": 90.3,
    "percentiles": {
      "p50": 180,
      "p90": 420,
      "p95": 650,
      "p99": 1200
    },
    "errorRate": 0.65
  }
}
```

### Load Testing Best Practices
1. **Start Small**: Begin with 10 users, gradually increase
2. **Test Staging**: Always test staging before production
3. **Monitor Resources**: Watch CPU, memory, and database
4. **Test Realistic Scenarios**: Simulate actual user behavior
5. **Regular Testing**: Run load tests before major releases

## 🔒 Security Audit

### Overview
Security auditing identifies vulnerabilities and ensures compliance with security best practices.

### Quick Start
```bash
# Run security audit
bun scripts/testing/security-audit.ts

# With specific target URL
AUDIT_URL=https://staging.example.com bun scripts/testing/security-audit.ts
```

### Security Checks

#### 1. Dependency Vulnerabilities
- Scans npm packages for known vulnerabilities
- Checks for outdated packages
- **Fix**: `npm audit fix` or update packages manually

#### 2. Secret Detection
- Scans code for hardcoded secrets
- Checks environment file security
- **Fix**: Move secrets to environment variables

#### 3. Security Headers
- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection
- Strict-Transport-Security
- Content-Security-Policy

#### 4. Authentication Security
- Password complexity requirements
- Rate limiting on auth endpoints
- Session cookie security
- **Fix**: Implement in auth configuration

#### 5. Authorization Checks
- Protected endpoints verification
- Role-based access control
- **Fix**: Use protectedProcedure for mutations

#### 6. Input Validation
- SQL injection prevention
- XSS protection
- Schema validation
- **Fix**: Use Zod schemas, parameterized queries

#### 7. File Permissions
- Checks sensitive file permissions
- **Fix**: `chmod 600` for sensitive files

#### 8. Docker Security
- Non-root user verification
- Image version pinning
- **Fix**: Update Dockerfile with security best practices

### Security Severity Levels

1. **CRITICAL** 🚨
   - Fix immediately
   - Blocks production deployment
   - Examples: Exposed secrets, SQL injection

2. **HIGH** ⚠️
   - Fix before production
   - Significant security risk
   - Examples: Missing auth, weak passwords

3. **MEDIUM** ℹ️
   - Should be addressed
   - Potential security improvement
   - Examples: Missing headers, outdated packages

4. **LOW** 📝
   - Nice to fix
   - Minor improvements
   - Examples: Code style, optimization

## 📊 Combined Testing Strategy

### Pre-Production Checklist
```bash
# 1. Run security audit
bun scripts/testing/security-audit.ts

# 2. Fix critical/high issues
# ... address issues ...

# 3. Run load test on staging
bun scripts/testing/load-test.ts --url=https://staging.example.com --users=100

# 4. Verify performance meets targets
# Check report for response times and error rates

# 5. Run penetration testing (optional)
# Consider professional security testing for production
```

### Continuous Testing
1. **CI/CD Integration**
   ```yaml
   - name: Security Audit
     run: bun scripts/testing/security-audit.ts
     
   - name: Load Test
     run: bun scripts/testing/load-test.ts --duration=120
   ```

2. **Scheduled Tests**
   - Daily: Basic security scan
   - Weekly: Full security audit
   - Before release: Load testing

3. **Monitoring**
   - Real-time performance metrics
   - Security alerts
   - Error tracking

## 🛠️ Tools and Resources

### Performance Testing Tools
- **k6**: Advanced load testing
- **Artillery**: Quick performance tests
- **Lighthouse**: Frontend performance

### Security Tools
- **OWASP ZAP**: Security scanning
- **Snyk**: Dependency scanning
- **npm audit**: Built-in security

### Monitoring
- **PostHog**: User analytics
- **Sentry**: Error tracking
- **Grafana**: Performance dashboards

## 📈 Performance Optimization Tips

1. **Database**
   - Add indexes for frequent queries
   - Use connection pooling
   - Optimize slow queries

2. **API**
   - Implement caching (Redis)
   - Use pagination for lists
   - Optimize payload sizes

3. **Frontend**
   - Lazy load components
   - Optimize images
   - Minimize bundle size

## 🔐 Security Best Practices

1. **Authentication**
   - Strong password requirements
   - Multi-factor authentication
   - Session timeout

2. **Data Protection**
   - Encrypt sensitive data
   - Use HTTPS everywhere
   - Secure backups

3. **Access Control**
   - Principle of least privilege
   - Regular permission audits
   - Activity logging

## 🚨 Incident Response

### Performance Issues
1. Check current load: `bun scripts/monitoring/manage-health.ts monitor`
2. Review error logs: `kamal app logs --grep ERROR`
3. Scale if needed: `kamal scale web=3`

### Security Incidents
1. Isolate affected systems
2. Review audit logs
3. Apply security patches
4. Notify stakeholders

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Performance Best Practices](https://web.dev/performance/)
- [Security Headers](https://securityheaders.com/)
- [Load Testing Guide](https://k6.io/docs/)

---

**Remember**: Security and performance are ongoing concerns, not one-time checks!