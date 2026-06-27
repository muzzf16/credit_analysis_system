# TESTING_STANDARD.md

# Testing Standards - Sistem Analisa Kredit PT BPR BAPERA BATANG

## Overview
This document defines the testing standards, practices, and requirements for the Credit Analysis System. Given the critical nature of financial software and regulatory requirements, comprehensive testing is essential to ensure system reliability, accuracy, security, and compliance.

## Testing Principles

### 1. Shift-Left Testing
- Test early in the development cycle
- Integrate testing into development process
- Automated testing at every stage

### 2. Test Pyramid
- **Unit Tests**: Foundation, largest quantity, fastest execution
- **Integration Tests**: Middle layer, test component interactions
- **E2E Tests**: Top layer, fewest in number, slowest execution

### 3. Continuous Testing
- Tests run automatically on every code change
- Fast feedback to developers
- Gates for deployment

### 4. Risk-Based Testing
- Prioritize testing based on risk and impact
- More thorough testing for critical components
- Financial and compliance areas require highest coverage

### 5. Independent Validation
- Separate team for testing (where possible)
- Independent test data
- No conflict of interest in testing own code

## Testing Levels

### Unit Testing
- **Coverage Target**: Minimum 80% line coverage for business logic
- **Framework**: Jest for backend, React Testing Library for frontend
- **Scope**: Individual functions, methods, components
- **Mocking**: External dependencies, databases, services
- **Test Data**: Synthetic data designed for edge cases

#### Unit Test Standards
- One assertion per test (when possible)
- Descriptive test names (should do X when Y)
- Arrange-Act-Assert pattern
- Independent tests (no dependencies between tests)
- Fast execution (< 1 second per test)

### Integration Testing
- **Coverage Target**: All critical integration points
- **Framework**: Jest + Supertest for API testing
- **Scope**: Service interactions, database operations, API endpoints
- **Test Environment**: Staging environment with production-like data
- **Database**: Test database with representative data

#### Integration Test Standards
- Test real integrations (not mocks) where feasible
- Clean test data setup and teardown
- Transaction rollback after each test
- Test both happy path and error scenarios
- Performance assertions (response times)

### End-to-End Testing
- **Framework**: Playwright or Cypress
- **Coverage**: Critical user journeys
- **Scope**: Complete workflows from UI to database
- **Test Environment**: Production-like environment
- **Data**: Realistic test data (anonymized production data)

#### E2E Test Standards
- Test complete business processes
- Include negative test cases
- Test cross-browser compatibility
- Test responsive design
- Accessibility testing

### Performance Testing
- **Load Testing**: Expected production load
- **Stress Testing**: Beyond expected load to find breaking points
- **Soak Testing**: Extended duration to find memory leaks
- **Spike Testing**: Sudden load increases
- **Tool**: k6, Artillery, or JMeter

#### Performance Benchmarks
- API response time: P95 < 2 seconds
- Page load time: P95 < 3 seconds
- Database query: P95 < 500ms
- Concurrent users: 1000 without degradation

### Security Testing
- **Frequency**: Quarterly for full assessment, continuous for critical
- **Scope**: OWASP Top 10, OWASP API Security Top 10
- **Types**:
  - Static Application Security Testing (SAST)
  - Dynamic Application Security Testing (DAST)
  - Software Composition Analysis (SCA)
  - Penetration Testing
  - Dependency vulnerability scanning

#### Security Test Standards
- No critical or high vulnerabilities allowed in production
- All dependencies scanned for known vulnerabilities
- Authentication and authorization thoroughly tested
- Input validation tested with malicious inputs
- Sensitive data protection verified

### Regression Testing
- Automated regression suite for critical paths
- Run on every build
- Quick feedback on breaking changes
- Maintained and updated regularly

## Test Data Management

### Test Data Principles
- **Isolation**: Test data independent from production
- **Representative**: Reflects real-world scenarios
- **Anonymized**: No real PII in non-production
- **Versioned**: Test data changes tracked
- **Refreshable**: Easy to refresh for consistency

### Test Data Strategies
- **Synthetic Data**: Generated for specific test scenarios
- **Anonymized Production Data**: Scrubbed production data
- **Data Builders**: Programmatic test data creation
- **Database Seeding**: Pre-defined datasets for specific tests

### Data Masking
- NIK, names, addresses masked with realistic substitutes
- Financial data preserved for calculation testing
- Dates and sequential data preserved for pattern testing

## Test Automation

### Automation Strategy
- Automate repetitive and regression tests
- Automate smoke tests for every deployment
- Automate critical path tests
- Manual testing for exploratory and usability

### Automation Standards
- Page Object Model for UI tests
- Reusable test utilities and helpers
- Clear test reporting
- CI/CD integration

## Functional Testing

### Credit Process Testing
- Application submission flow
- Document upload and OCR processing
- Financial analysis calculations
- Rule engine evaluation
- Policy application
- Credit scoring
- Workflow approvals
- Committee processes
- Disbursement processing
- Monitoring and EWS

### Business Rules Testing
- All credit formulas verified (DSR, RPC, DSCR, 5C scoring)
- Rule engine accuracy
- Policy enforcement
- Calculation accuracy to 2 decimal places

### Workflow Testing
- All workflow transitions
- SLA enforcement
- Escalation triggers
- Notification delivery
- Audit trail completeness

## Non-Functional Testing

### Reliability Testing
- Failure recovery testing
- Graceful degradation
- Data consistency after failures

### Scalability Testing
- Load testing at 2x expected peak
- Database connection pool limits
- Concurrent user testing

### Maintainability Testing
- Code review compliance
- Documentation completeness
- Technical debt assessment

### Compatibility Testing
- Browser compatibility (Chrome, Firefox, Safari, Edge)
- Device compatibility (desktop, tablet, mobile)
- API version compatibility

## Test Documentation

### Test Plan
- Scope and objectives
- Test strategy
- Resource allocation
- Schedule and milestones
- Risk assessment
- Entry and exit criteria

### Test Cases
- Unique identifier
- Description and purpose
- Preconditions
- Test steps
- Expected results
- Actual results
- Pass/Fail status
- Notes and defects

### Test Reports
- Daily test execution summary
- Defect reports with severity and priority
- Test coverage reports
- Performance test results
- Security assessment results

## Defect Management

### Defect Classification
| Severity | Description | Examples | Response Time |
|----------|-------------|----------|---------------|
| Critical | System down or data loss | Cannot submit application | 1 hour |
| High | Major functionality broken | Rule engine fails | 4 hours |
| Medium | Feature not working as expected | Report shows wrong data | 1 day |
| Low | Minor issues, workaround exists | UI alignment issue | 1 week |

### Defect Lifecycle
1. **New**: Defect reported
2. **Assigned**: Assigned to developer
3. **In Progress**: Developer working on fix
4. **Fixed**: Fix implemented
5. **Verified**: Tested by QA
6. **Closed**: Fix confirmed in production
7. **Reopened**: Fix not working or new issue

## Test Environments

### Environment Strategy
- **Development**: Individual developer environments
- **Integration**: Shared environment for integration testing
- **Staging**: Production-like for final testing
- **Production**: Live system (monitoring only)

### Environment Standards
- Production-like data (anonymized)
- Same configuration as production
- Isolated from production data
- Regular refresh from anonymized production

## Continuous Integration/Testing

### CI Pipeline
- Lint and static analysis on every commit
- Unit tests on every commit
- Integration tests on PR creation
- Security scan on PR creation
- E2E tests on merge to develop
- Performance tests nightly

### Quality Gates
- No critical vulnerabilities
- 80% unit test coverage for new code
- All tests passing
- No new linting errors
- Security scan clean

## Roles and Responsibilities

### Developer
- Write unit tests for new code
- Fix defects in own code
- Participate in code reviews
- Maintain test automation

### QA Engineer
- Develop integration and E2E tests
- Execute manual test cases
- Report and track defects
- Maintain test environment

### Security Team
- Security testing
- Vulnerability assessment
- Penetration testing

### DevOps
- Test environment maintenance
- CI/CD pipeline maintenance
- Test data management

## Metrics and Reporting

### Test Metrics
- Test coverage percentage
- Test execution rate
- Defect density
- Defect leakage to production
- Test automation percentage
- Mean time to detect defects
- Mean time to resolve defects

### Reporting Frequency
- Daily: Test execution summary
- Weekly: Quality metrics dashboard
- Monthly: Quality trend analysis
- Per release: Release quality report

## Compliance Testing

### Regulatory Testing
- OJK reporting accuracy
- Data retention verification
- Audit trail completeness
- Privacy compliance

### Audit Trail Testing
- Verify all actions logged
- Verify immutability of logs
- Verify log retention periods
- Verify access to audit logs

## Tools and Frameworks

### Backend Testing
- Jest (unit and integration)
- Supertest (API testing)
- pgTAP (database testing)

### Frontend Testing
- React Testing Library
- Jest
- Playwright (E2E)

### Performance Testing
- k6
- Artillery

### Security Testing
- OWASP ZAP
- SonarQube
- Snyk (dependency scanning)
- Trivy (container scanning)

### Test Management
- TestRail or similar for test case management
- Jira for defect tracking
- Allure or similar for test reporting

## Appendix: Sample Test Cases

### Sample Unit Test
```javascript
describe('Credit Scoring Service', () => {
  describe('calculateDSR', () => {
    it('should correctly calculate DSR for consumer loan', () => {
      const monthlyIncome = 15000000;
      const monthlyDebt = 4500000;
      const expectedDSR = 0.30; // 30%
      
      const result = calculateDSR(monthlyIncome, monthlyDebt);
      
      expect(result).toBeCloseTo(expectedDSR, 2);
    });

    it('should return 0 when income is 0', () => {
      const result = calculateDSR(0, 1000000);
      expect(result).toBe(0);
    });

    it('should handle decimal precision correctly', () => {
      const monthlyIncome = 10000000;
      const monthlyDebt = 3333333;
      const expectedDSR = 0.333333; // 33.33%
      
      const result = calculateDSR(monthlyIncome, monthlyDebt);
      expect(result).toBeCloseTo(expectedDSR, 2);
    });
  });
});
```

### Sample Integration Test
```javascript
describe('POST /api/v1/pengajuan', () => {
  it('should create new loan application', async () => {
    const applicationData = {
      debiturId: 'valid-uuid',
      produkId: 'valid-uuid',
      jumlahPinjaman: 100000000,
      tenor: 24,
      tujuan: 'Modal kerja'
    };

    const response = await request(app)
      .post('/api/v1/pengajuan')
      .set('Authorization', `Bearer ${validToken}`)
      .send(applicationData);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject({
      debiturId: applicationData.debiturId,
      produkId: applicationData.produkId,
      jumlahPinjaman: applicationData.jumlahPinjaman,
      tenor: applicationData.tenor
    });
    expect(response.body.data.id).toBeDefined();
    expect(response.body.data.status).toBe('DRAFT');
  });

  it('should reject application with invalid data', async () => {
    const invalidData = {
      debiturId: 'invalid-uuid',
      produkId: 'valid-uuid',
      jumlahPinjaman: -100000, // negative amount
      tenor: 0
    };

    const response = await request(app)
      .post('/api/v1/pengajuan')
      .set('Authorization', `Bearer ${validToken}`)
      .send(invalidData);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.errors.length).toBeGreaterThan(0);
  });
});
```

---
*Document ini adalah bagian dari Living Specification untuk Sistem Analisa Kredit PT BPR BAPERA BATANG. 
Diperbarui terakhir: 2026-06-27*