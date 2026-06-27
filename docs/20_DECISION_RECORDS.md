# DECISION_RECORDS.md

# Decision Records - Sistem Analisa Kredit PT BPR BAPERA BATANG

## Gambaran Umum
Decision Records mendokumentasikan semua keputusan penting yang diambil selama pengembangan dan operasional Sistem Analisa Kredit. Dokumen ini berfungsi sebagai arsip keputusan yang dapat direferensikan untuk memahami konteks, alasan, dan konsekuensi dari setiap keputusan penting yang diambil.

## Tujuan Utama
1. Mendokumentasikan keputusan-keputusan arsitektural dan teknis penting
2. Mencatat alasan dan konteks di balik setiap keputusan
3. Menyediakan referensi untuk pengembangan masa depan
4. Mencegah pengambilan keputusan yang sama berulang kali
5. Memudahkan onboarding anggota tim baru
6. Mendukung audit dan compliance
7. Memfasilitasi learning dari pengalaman

## Kategori Keputusan

### 1. Arsitektural Decisions (ADR - Architecture Decision Records)
Keputusan yang mempengaruhi struktur sistem secara keseluruhan:
- Pemilihan teknologi stack
- Pola arsitektur yang digunakan
- Pertimbangan desain sistem tingkat tinggi
- Trade-offs yang dibuat

### 2. Data Model Decisions
Keputusan terkait desain database:
- Skema tabel dan relasi
- Pemilihan tipe data
- Strategi indeks
- Normalisasi vs denormalisasi

### 3. API Design Decisions
Keputusan terkait desain API:
- Format request/response
- Strategi versioning
- Autentikasi dan otorisasi
- Error handling patterns

### 4. Security Decisions
Keputusan terkait keamanan:
- Enkripsi yang digunakan
- Strategi autentikasi
- Authorization model
- Compliance requirements

### 5. Process Decisions
Keputusan terkait proses bisnis:
- Workflow design
- Approval matrices
- SLA definitions
- Exception handling

### 6. AI/ML Decisions
Keputusan terkait komponen AI:
- Model selection
- Prompt engineering approaches
- Training data strategies
- Explainability approaches

## Format Decision Record

### Template
```markdown
# [DECISION-ID]: [Title]

## Status
[Proposed | Accepted | Deprecated | Superseded]

## Date
[YYYY-MM-DD]

## Deciders
[Names/Roles of people who made the decision]

## Context
[Description of the situation and problem]

## Decision
[What was decided]

## Rationale
[Why this decision was made]

## Consequences
[What are the consequences of this decision]

## Alternatives Considered
[What other options were evaluated]

## Related Decisions
[Links to related decisions]

## References
[Links to documentation, discussions, etc.]
```

## Decision Records

### ADR-001: Technology Stack Selection

**Status**: Accepted  
**Date**: 2026-01-15  
**Deciders**: Technical Lead, CTO  
**Related**: ARCHITECTURE.md, DEVELOPMENT_GUIDE.md

#### Context
We needed to select a technology stack for the Credit Analysis System that would support:
- Microservices architecture
- Strong typing and maintainability
- Good ecosystem for financial applications
- Team expertise and hiring availability
- Performance requirements for AI/ML integration

#### Decision
- **Backend**: Node.js + Express + TypeScript
- **Frontend**: React + Vite + TailwindCSS
- **Database**: PostgreSQL 15
- **ORM**: Prisma
- **AI**: Local LLM (llama.cpp) with Qwen3.5
- **Storage**: MinIO (S3-compatible)

#### Rationale
- Node.js: Good async I/O for API services, large ecosystem
- TypeScript: Type safety for complex business logic
- React: Widely adopted, good component ecosystem
- PostgreSQL: ACID compliance, JSONB support, mature
- Prisma: Type-safe ORM, good migration support
- Local LLM: Data sovereignty, cost control, customization

#### Consequences
- Need to manage Node.js version consistency
- TypeScript learning curve for some team members
- PostgreSQL DBA expertise required
- Local LLM infrastructure maintenance overhead

#### Alternatives Considered
- Java/Spring Boot (more verbose, better enterprise support)
- Python/FastAPI (better for ML, less performant for APIs)
- MySQL (less feature-rich than PostgreSQL)
- Managed cloud AI services (higher cost, data sovereignty concerns)

---

### ADR-002: Database Schema Design Approach

**Status**: Accepted  
**Date**: 2026-01-20  
**Deciders**: Technical Lead, Database Architect  
**Related**: DATABASE_STANDARD.md

#### Context
The system requires 23 core tables with complex relationships, audit requirements, and regulatory compliance needs.

#### Decision
- Use UUID as primary keys for all tables
- Implement soft deletes with `deleted_at` timestamp
- Use JSONB for flexible attributes where schema may evolve
- Implement comprehensive audit trail via database triggers
- Use GIN indexes for JSONB and full-text search fields

#### Rationale
- UUID: Better for distributed systems, no sequential ID exposure
- Soft deletes: Required for audit compliance and data recovery
- JSONB: Flexibility for evolving business requirements
- Audit triggers: Automatic, consistent audit trail
- GIN indexes: Performance for complex queries

#### Consequences
- Larger index sizes with UUID
- Need to manage UUID generation strategy
- JSONB queries require careful optimization
- Trigger maintenance overhead

#### Alternatives Considered
- Sequential integers (simpler, but exposes business information)
- Application-level audit logging (more flexible, but inconsistent)
- EAV model (too flexible, poor performance)

---

### ADR-003: Authentication and Authorization Strategy

**Status**: Accepted  
**Date**: 2026-01-22  
**Deciders**: Security Architect, Backend Lead  
**Related**: SECURITY_STANDARD.md

#### Context
The system requires role-based access control with fine-grained permissions for 6 user roles across multiple modules.

#### Decision
- JWT-based authentication with 8-hour access tokens
- 7-day refresh tokens with rotation
- RBAC implemented at middleware level
- Field-level encryption for NIK and sensitive data
- Session tracking in Redis (optional)

#### Rationale
- JWT: Stateless, scalable, good for APIs
- RBAC: Matches organizational structure
- Field encryption: Compliance with data protection regulations
- Refresh tokens: Security without frequent re-login

#### Consequences
- Token revocation complexity (requires blacklist or short expiry)
- Need secure token storage on client
- Encryption key management overhead
- Session state considerations

#### Alternatives Considered
- Session-based auth (stateful, not ideal for APIs)
- OAuth2 (overkill for internal system)
- SAML (enterprise-grade, complex implementation)

---

### ADR-004: AI Service Architecture

**Status**: Accepted  
**Date**: 2026-02-01  
**Deciders**: AI Architect, Backend Lead  
**Related**: AI_DEVELOPER_GUIDE.md

#### Context
The system needs AI capabilities for credit analysis, document processing, and narrative generation while maintaining explainability and compliance.

#### Decision
- Local LLM deployment using llama.cpp
- Separate services for VLM (port 1976), Embedding (port 1977), LLM (port 1978)
- AI Credit Analyst as a separate bounded context
- Knowledge Service for managing sources
- Strict separation: AI assists, Rule Engine decides

#### Rationale
- Local deployment: Data sovereignty, cost control, customization
- Separation of concerns: Each AI function has clear responsibility
- Knowledge Service: Ensures verifiable sources for AI outputs
- Explainability: Required for regulatory compliance

#### Consequences
- Infrastructure cost for GPU servers
- Model maintenance and updates
- Need for prompt engineering expertise
- Knowledge base management overhead

#### Alternatives Considered
- Cloud AI APIs (easier, but data sovereignty issues)
- Single monolithic AI service (simpler, but less flexible)
- External vendor solutions (expensive, less control)

---

### ADR-005: Rule Engine Configuration Approach

**Status**: Accepted  
**Date**: 2026-02-05  
**Deciders**: Business Analyst, Technical Lead  
**Related**: RULE_ENGINE.md, POLICY_ENGINE.md

#### Context
Business rules for credit decisions change frequently and need to be managed by business users without code changes.

#### Decision
- All rules stored as data in database (not hardcoded)
- Rule definitions include: condition, operator, threshold, recommendation, explanation
- Policy Engine manages rule groupings and inheritance
- Versioning for all rule changes
- Rule simulation and what-if analysis capabilities

#### Rationale
- Configuration over hardcode: Core principle of the system
- Business agility: Changes without developer involvement
- Audit trail: Required for compliance
- Explainability: Each decision traces to specific rules

#### Consequences
- Need rule management UI for business users
- Performance overhead from dynamic rule evaluation
- Rule testing and validation complexity
- Migration effort from any hardcoded rules

#### Alternatives Considered
- Hardcoded rules (faster initially, but inflexible)
- External rules engine (Drools, etc.) (powerful, but complex)
- Excel-based rules (familiar to users, but error-prone)

---

### ADR-006: Microservices Communication Strategy

**Status**: Accepted  
**Date**: 2026-02-10  
**Deciders**: Architecture Team  
**Related**: ARCHITECTURE.md

#### Context
The system is designed as microservices, requiring clear communication patterns between services.

#### Decision
- REST APIs for synchronous communication
- Event-driven architecture for async operations (using message queue)
- API Gateway for external traffic
- Service mesh for inter-service communication (future)
- Shared kernel for common types and constants

#### Rationale
- REST: Simple, widely understood, good for CRUD
- Events: Decoupling, scalability, audit trail
- API Gateway: Single entry point, security, routing
- Shared kernel: Consistency without tight coupling

#### Consequences
- Network latency between services
- Need for service discovery
- Distributed tracing complexity
- Data consistency challenges

#### Alternatives Considered
- Monolith (simpler, but less scalable)
- GraphQL (flexible, but adds complexity)
- gRPC (performant, but steeper learning curve)

---

### ADR-007: Document Storage Strategy

**Status**: Accepted  
**Date**: 2026-02-15  
**Deciders**: Infrastructure Lead, Security Architect  
**Related**: SECURITY_STANDARD.md

#### Context
Documents (KTP, NPWP, financial statements, collateral photos) need secure, scalable storage with audit capabilities.

#### Decision
- MinIO for object storage (S3-compatible)
- Documents never stored on local filesystem
- Separate buckets for different document types
- Server-side encryption for sensitive documents
- Presigned URLs for secure access

#### Rationale
- MinIO: Open source, S3-compatible, easy to deploy
- Object storage: Scalable, durable, cost-effective
- Encryption: Security and compliance
- Presigned URLs: Secure, time-limited access

#### Consequences
- MinIO cluster management
- Network dependency for document access
- Backup strategy for object storage
- Cost monitoring for storage growth

#### Alternatives Considered
- Local filesystem (simple, but not scalable)
- Cloud storage (S3, GCS) (scalable, but external dependency)
- Database BLOBs (not recommended for large files)

---

### ADR-008: Notification System Design

**Status**: Accepted  
**Date**: 2026-02-20  
**Deciders**: Backend Lead, Product Owner  
**Related**: WORKFLOW_ENGINE.md

#### Context
The system needs to notify users of various events (approval requests, SLA warnings, committee meetings, etc.) through multiple channels.

#### Decision
- Centralized Notification Service
- Support for Email, WhatsApp, SMS, In-App
- Template-based messaging
- Queue-based async processing
- Preference management per user

#### Rationale
- Centralized: Consistent experience, easier maintenance
- Multi-channel: Users have different preferences
- Templates: Consistency and easy updates
- Async: Non-blocking, better UX

#### Consequences
- Template management overhead
- Multiple channel integrations to maintain
- Queue infrastructure (Redis/RabbitMQ)
- Delivery tracking complexity

#### Alternatives Considered
- Direct calls from each service (tight coupling)
- Third-party notification service (cost, dependency)
- Email-only (limited reach)

---

## Decision Log by Category

### Technology Decisions
| ID | Decision | Date | Status |
|----|----------|------|--------|
| ADR-001 | Technology Stack Selection | 2026-01-15 | Accepted |
| ADR-002 | Database Schema Design | 2026-01-20 | Accepted |
| ADR-003 | Authentication Strategy | 2026-01-22 | Accepted |
| ADR-006 | Microservices Communication | 2026-02-10 | Accepted |
| ADR-007 | Document Storage | 2026-02-15 | Accepted |
| ADR-008 | Notification System | 2026-02-20 | Accepted |

### Architecture Decisions
| ID | Decision | Date | Status |
|----|----------|------|--------|
| ADR-004 | AI Service Architecture | 2026-02-01 | Accepted |
| ADR-005 | Rule Engine Configuration | 2026-02-05 | Accepted |

### Pending Decisions
| ID | Decision | Date | Status |
|----|----------|------|--------|
| ADR-009 | Message Queue Selection | - | Proposed |
| ADR-010 | Caching Strategy | - | Proposed |
| ADR-011 | Monitoring Stack | - | Proposed |
| ADR-012 | CI/CD Pipeline Tooling | - | Proposed |

## Decision Making Process

### Proposing a Decision
1. Identify need for architectural/technical decision
2. Document context and problem statement
3. Research alternatives (at least 2-3 options)
4. Evaluate trade-offs
5. Draft decision record
6. Schedule review meeting

### Review Process
1. Technical review by architecture team
2. Security review if applicable
3. Cost/performance impact assessment
4. Team discussion and feedback
5. Final decision by deciders

### Implementation
1. Update relevant documentation
2. Create implementation tasks
3. Assign implementation team
4. Set timeline
5. Track implementation progress

### Post-Decision Review
1. Review after 30 days
2. Assess if decision still valid
3. Document any lessons learned
4. Update if significant changes needed

## Governance

### Who Can Propose Decisions
- Technical Lead
- Senior Developers
- Architects
- Product Owner (for business-impacting decisions)

### Who Approves Decisions
- Technical decisions: Technical Lead + CTO
- Architecture decisions: Architecture team consensus
- Security decisions: Security Architect + CTO
- Cost decisions: CTO + CFO

### Review Cadence
- Monthly: Review pending decisions
- Quarterly: Review implemented decisions
- Annually: Full decision audit

## Templates

### Quick Decision Record (for minor decisions)
```markdown
# QDR-[ID]: [Title]
**Date**: YYYY-MM-DD
**Deciders**: [Names]
**Decision**: [One sentence]
**Rationale**: [Brief reason]
**Consequences**: [Key impacts]
```

### Full Decision Record (for major decisions)
```markdown
# ADR-[ID]: [Title]

## Status
[Proposed | Accepted | Deprecated | Superseded]

## Date
YYYY-MM-DD

## Deciders
[Names and roles]

## Context
[2-3 paragraphs describing the situation]

## Decision
[Clear statement of what was decided]

## Rationale
[Detailed explanation of why]

## Consequences
### Positive
- [Benefit 1]
- [Benefit 2]

### Negative
- [Trade-off 1]
- [Trade-off 2]

### Neutral
- [Change 1]
- [Change 2]

## Alternatives Considered
### Alternative 1: [Name]
- Description
- Pros
- Cons
- Why not chosen

### Alternative 2: [Name]
- Description
- Pros
- Cons
- Why not chosen

## Implementation Notes
- [ ] Task 1
- [ ] Task 2
- [ ] Timeline

## Related Decisions
- [ADR-XXX]: Related decision
- [DCR-XXX]: Related decision

## References
- [Link to discussion]
- [Link to documentation]
- [Link to prototype]
```

## Appendix: Decision Principles

1. **Reversibility**: Prefer reversible decisions when possible
2. **Delay**: Delay decisions until last responsible moment
3. **Irreversibility**: Treat irreversible decisions with extra care
4. **Experimentation**: Use spikes/prototypes for uncertain decisions
5. **Documentation**: All significant decisions must be documented
6. **Review**: Decisions should be revisited periodically
7. **Consistency**: Similar decisions should have similar outcomes
8. **Transparency**: Decisions should be explainable to stakeholders

---
*Document ini adalah bagian dari Living Specification untuk Sistem Analisa Kredit PT BPR BAPERA BATANG. 
Diperbarui terakhir: 2026-06-27*