# SECURITY_STANDARD.md

# Security Standards - Sistem Analisa Kredit PT BPR BAPERA BATANG

## Overview
This document defines the comprehensive security standards, policies, and procedures for the Credit Analysis System. Given the sensitive nature of financial data and regulatory requirements, security is paramount in every aspect of the system design, development, deployment, and operation.

## Security Principles

### 1. Defense in Depth
Implement multiple layers of security controls throughout the system.

### 2. Least Privilege
Grant minimum necessary access rights to users and services.

### 3. Separation of Duties
Critical functions require multiple people to prevent fraud and errors.

### 4. Fail Securely
When failures occur, the system should remain in a secure state.

### 5. Don't Trust User Input
Validate, sanitize, and encode all input regardless of source.

### 6. Security by Design
Integrate security considerations from the beginning, not as an afterthought.

### 7. Privacy by Design
Protect personal data throughout its lifecycle.

### 8. Regular Security Assessment
Continuously evaluate and improve security posture.

## Authentication

### Password Policy
- Minimum 12 characters
- Complexity requirements (uppercase, lowercase, numbers, special characters)
- Password history (prevent reuse of last 5 passwords)
- Maximum age (90 days for privileged accounts, 180 days for standard)
- Account lockout after 5 failed attempts (15 minute lockout)
- No password sharing permitted

### Multi-Factor Authentication (MFA)
- Required for all privileged accounts (ADMIN, DIREKSI, KABID)
- Required for all service accounts
- Recommended for ANALIS and AO roles
- Supported methods: TOTP, SMS, Email, Hardware Token

### Session Management
- JWT tokens with appropriate expiration (8 hours access, 7 days refresh)
- Secure token storage (HttpOnly cookies, secure storage on client)
- Token rotation on refresh
- Immediate invalidation on logout or security events
- Session timeout after 30 minutes of inactivity for sensitive operations

### Account Lockout Policy
- 5 failed login attempts → 15 minute lockout
- 10 failed attempts → 1 hour lockout
- 15 failed attempts → Account disabled, requires admin reset
- Notification sent to user on lockout

## Authorization

### Role-Based Access Control (RBAC)
- Role assignment based on job function
- Separation of duties between conflicting roles
- Regular review of role assignments
- Principle of least privilege

### Permission Matrix
| Resource | ADMIN | DIREKSI | KABID | ANALIS | AO | SPI |
|----------|-------|---------|-------|--------|----|----|
| Debitur Master | CRUD | R | R | CRU | CRU | R |
| Pengajuan Kredit | CRUD | R | RU | CRU | CRU | R |
| Survey Data | CRUD | R | R | CRU | CRU | R |
| Analisa Kredit | CRUD | R | RU | CRU | CU | R |
| Scoring Engine | R | R | R | R | - | R |
| Rule Management | CRUD | R | R | R | - | R |
| Policy Management | CRUD | R | RU | R | - | R |
| Approval | R | RU | RU | R | - | R |
| MAK Generation | R | R | R | CRU | - | R |
| Disbursement | CRUD | R | R | R | - | R |
| Monitoring | R | R | R | R | R | R |
| EWS | CRUD | R | R | R | R | R |
| System Config | CRUD | R | - | - | - | R |
| Audit Logs | R | R | R | R | R | CRUD |

**Legend**: C=Create, R=Read, U=Update, D=Delete, RU=Read+Update (approval)

### Field-Level Security
- NIK and sensitive personal data encrypted at rest
- Financial data encrypted at rest
- Salary/income information restricted to relevant roles
- Audit trail immutable for all operations

## Data Protection

### Encryption Standards
- **At Rest**: AES-256 for sensitive fields
- **In Transit**: TLS 1.2+ (TLS 1.3 preferred)
- **Key Management**: Separate key per environment, rotation every 90 days
- **Algorithm**: Use only NIST-approved algorithms

### Data Classification
| Classification | Examples | Protection Level |
|---------------|----------|------------------|
| Public | Marketing materials, product info | Standard |
| Internal | Internal procedures, org charts | Standard + ACL |
| Confidential | Customer PII, financial data | Encryption + ACL + Audit |
| Restricted | Audit logs, legal documents | Encryption + MFA + Audit + Retention |

### Data Masking
- PII masked in non-production environments
- Dynamic masking for authorized users viewing restricted data
- Static masking for data exports and reports

### Data Retention
- Active loan data: Life of loan + 7 years
- Closed loan data: 10 years post-closure
- Audit logs: 10 years
- Application data (rejected): 5 years

## Network Security

### Network Architecture
- DMZ for public-facing services (frontend, API gateway)
- Internal network for backend services
- Database in private subnet
- No direct database access from internet

### Firewall Rules
- Default deny all inbound/outbound
- Allow only required ports and protocols
- Whitelist for management access
- Regular firewall rule review

### VPN and Remote Access
- Required for all remote access
- MFA for VPN authentication
- Session timeout after 4 hours
- Logging of all remote access

## Application Security

### Input Validation
- Whitelist validation for all inputs
- Server-side validation (never trust client)
- Parameterized queries to prevent SQL injection
- Input sanitization to prevent XSS
- File upload validation (type, size, content)

### Output Encoding
- Context-appropriate encoding (HTML, JavaScript, URL)
- Prevent injection attacks
- Secure JSON serialization

### Error Handling
- Generic error messages to users
- Detailed logging for debugging
- No stack traces in production responses
- Proper HTTP status codes

### Logging and Monitoring
- Comprehensive audit logging
- Security event logging
- Log protection (tamper-evident)
- Regular log review
- SIEM integration

## API Security

### Authentication and Authorization
- JWT tokens with strong secrets
- Token expiration and refresh
- Scope-based permissions
- Rate limiting per user/IP

### API Gateway
- Request validation
- Rate limiting
- IP whitelisting/blacklisting
- API key management
- Request/response logging

### REST API Security
- HTTPS only
- CORS properly configured
- CSRF protection where applicable
- API versioning

## Database Security

### Access Control
- Principle of least privilege
- Application user with limited permissions
- Separate admin access
- Regular privilege review

### Database Activity Monitoring
- Monitor for suspicious queries
- Alert on bulk data access
- Audit all DDL and sensitive DML
- Regular vulnerability scanning

### Backup Security
- Encrypted backups
- Secure offsite storage
- Regular restore testing
- Backup access logging

## Infrastructure Security

### Container Security
- Base image scanning
- Minimal container privileges
- Read-only filesystems where possible
- Secret management (not in environment variables)
- Regular image updates

### Secrets Management
- Use HashiCorp Vault or similar
- No hardcoded secrets in code
- Secret rotation
- Audit secret access

### Host Hardening
- Regular security patches
- Minimal services running
- Disable unused accounts
- Host-based firewall
- Intrusion detection

## Compliance and Auditing

### Regulatory Compliance
- OJK regulations for financial institutions
- Data protection laws (PDP Law if applicable)
- PCI DSS if handling card data
- Regular compliance audits

### Audit Requirements
- Comprehensive audit trails
- Immutable audit logs
- Audit log retention (10 years)
- Regular audit review
- Support for regulatory examinations

### Change Management
- All changes through approved process
- Change documentation
- Rollback procedures
- Post-change verification

## Security Incident Response

### Incident Classification
- **P0 - Critical**: Data breach, system compromise
- **P1 - High**: Unauthorized access attempt, service disruption
- **P2 - Medium**: Policy violation, suspicious activity
- **P3 - Low**: Configuration issue, minor violation

### Response Procedures
1. Detection and analysis
2. Containment
3. Eradication
4. Recovery
5. Post-incident review

### Communication Plan
- Internal escalation within 1 hour for P0/P1
- Management notification within 4 hours
- Regulatory notification as required
- Customer notification as required

## Security Testing

### Regular Assessments
- Quarterly vulnerability scanning
- Annual penetration testing
- Monthly security patch review
- Continuous dependency scanning

### Code Review
- Security-focused code review for all changes
- Static application security testing (SAST)
- Dynamic application security testing (DAST)
- Software composition analysis (SCA)

## Security Awareness

### Training
- Annual security awareness training for all employees
- Role-specific security training
- Phishing simulation exercises
- New hire security orientation

### Policies
- Acceptable use policy
- Data classification policy
- Incident reporting policy
- Remote work security policy

## Disaster Recovery

### Backup Strategy
- Daily incremental backups
- Weekly full backups
- Offsite backup storage
- Monthly recovery testing

### Business Continuity
- RTO: 4 hours
- RPO: 15 minutes
- Hot site availability
- Documented recovery procedures

## Third-Party Security

### Vendor Management
- Security assessment of vendors
- Contractual security requirements
- Regular vendor security reviews
- Right to audit vendors

### Service Dependencies
- Document all third-party services
- Understand their security posture
- Monitor for breaches in dependencies

## Security Metrics

### Key Metrics
- Time to detect security incidents
- Time to respond to security incidents
- Number of security incidents by severity
- Patch compliance rate
- Vulnerability remediation time
- Audit finding closure rate

## References

- OWASP Top 10
- OWASP ASVS (Application Security Verification Standard)
- NIST Cybersecurity Framework
- ISO 27001
- PCI DSS (if applicable)
- OJK regulations on information technology

---
*Document ini adalah bagian dari Living Specification untuk Sistem Analisa Kredit PT BPR BAPERA BATANG. 
Diperbarui terakhir: 2026-06-27*