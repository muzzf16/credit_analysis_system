# DATABASE_STANDARD.md

# Database Standards - Sistem Analisa Kredit PT BPR BAPERA BATANG

## Overview
This document defines the standards, conventions, and best practices for database design, development, and maintenance in the Credit Analysis System. All database-related work must adhere to these standards to ensure consistency, maintainability, performance, and data integrity.

## Database Technology

### Primary Database
- **System**: PostgreSQL 15 (or higher)
- **Justification**: 
  - ACID compliance for financial transactions
  - Advanced JSONB support for flexible data structures
  - Excellent performance for complex queries
  - Strong GIS capabilities (if needed for location-based analysis)
  - Robust replication and high availability features
  - Strong security features including row-level security
  - Extensive partitioning capabilities for large tables
  - Mature ecosystem with excellent tooling

### Connection Management
- Connection pooling using PgBouncer or similar
- Minimum connections: 20
- Maximum connections: 100 (configurable based on workload)
- Connection timeout: 30 seconds
- Idle timeout: 300 seconds
- Statement timeout: 60 seconds (configurable per query type)
- Lock timeout: 10 seconds

## Naming Conventions

### General Principles
- Use lowercase letters, numbers, and underscores only
- Use singular names for tables representing entities
- Use descriptive, meaningful names
- Avoid abbreviations unless they are widely understood
- Maximum name length: 63 characters (PostgreSQL identifier limit)
- Use domain-specific terminology consistently

### Tables
- Name: Singular noun representing the entity (e.g., `debitur`, `pengajuan`, not `debitors` or `loan_applications`)
- Separate words with underscores
- Use full words when clarity is important (e.g., `nomor_identitas` not `no_identitas`)
- Exception: Commonly accepted abbreviations like `id`, `no`, `nr`, `dt`, `idr`, `usd`, `uid`, `guid`

### Columns
- Primary key: `id` (UUID or BIGSERIAL)
- Foreign keys: `{referenced_table}_id` (e.g., `debitur_id`)
- Timestamps: 
  - `created_at`: TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  - `updated_at`: TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  - Optional: `deleted_at`: TIMESTAMP WITH TIME ZONE (for soft deletes)
- Status fields: Use descriptive names like `status`, `approval_status`, `payment_status`
- Boolean fields: Prefix with `is_`, `has_`, `can_`, `should_` (e.g., `is_active`, `has_collateral`)
- Code/identifier fields: Use `_kode` suffix (e.g., `produk_kode`, `status_kode`)
- Name/description fields: Use `_nama` or `_deskripsi` suffix
- Numeric amounts: Use `_nominal` or `_jumlah` suffix with appropriate numeric type
- Percentages: Use `_persentase` suffix with DECIMAL(5,2) format
- Ratios: Use `_rasio` suffix with appropriate decimal precision

### Indexes
- Primary key index: Automatically created
- Foreign key indexes: Named `{table}_{column}_fk_idx` (e.g., `pengajuan_debitur_id_fk_idx`)
- Unique constraints: Named `{table}_{column}_uk` (e.g., `debitur_nik_uk`)
- Descriptive indexes: Named `{table}_{column}_idx` or `{table}_{col1}_{col2}_idx` for composite
- Special purpose indexes: Include purpose in name (e.g., `debitur_nama_search_idx` for trigram index)

### Constraints
- Primary key: `pk_{table}` (e.g., `pk_debitur`)
- Foreign key: `fk_{table}_{referenced_table}` (e.g., `fk_pengajuan_debitur`)
- Unique constraint: `uk_{table}_{column}` (e.g., `uk_debitur_nik`)
- Check constraint: `ck_{table}_{condition}` (e.g., `ck_pengajuan_jumlah_positif`)
- Exclusion constraint: `excl_{table}_{condition}` (when needed)

### Triggers
- Trigger function: `trg_fn_{table}_{operation}_` (e.g., `trg_fn_debitur_ins_upd_`)
- Trigger: `trg_{table}_{operation}_` (e.g., `trg_debitur_ins_upd_`)
- For audit triggers: `trg_fn_audit_{table}_` and `trg_audit_{table}_`

### Views
- Standard view: `vw_{purpose}` (e.g., `vw_pengajuan_aktif`)
- Materialized view: `mv_{purpose}` (e.g., `mv_laporan_bulanan`)
- Aggregation view: `vwa_{purpose}` (e.g., `vwa_statistik_kredit`)

### Functions and Procedures
- Function: `fn_{purpose}` (e.g., `fn_hitung_dsr`, `fn_format_rupiah`)
- Procedure: `sp_{purpose}` (e.g., `sp_proses_pengajuan`, `sp_generate_laporan`)
- Package-like grouping: Use schema or prefix grouping (e.g., `fn_kkr_*` for Kredit Konsumtif Ringan)

### Sequences
- Sequence: `seq_{table}_{column}` (e.g., `seq_pengajuan_id`) - though SERIAL/BIGSERIAL preferred

## Schema Organization

### Schemas
- `public`: Default schema for application tables
- `audit`: For audit log tables and related functions
- `api`: For API-specific views and functions
- `reporting`: For reporting-optimized views and materialized views
- `temp`: For temporary tables (if needed)
- `archive`: For archived data tables
- `extensions`: For PostgreSQL extension objects

### Schema Organization by Business Domain
Consider using schemas for major business domains as the system grows:
- `customer`: Customer management tables
- `loan`: Loan application and processing tables
- `financial`: Financial analysis tables
- `collateral`: Collateral management tables
- `policy`: Policy and rule management tables
- `workflow`: Workflow and approval tables
- `monitoring`: Monitoring and early warning tables
- `knowledge`: Knowledge management tables
- `accounting`: Accounting and financial transaction tables
- `admin`: Administrative tables (users, roles, settings)

## Data Types

### Primary Keys
- **Preferred**: `UUID` (version 4) for distributed systems and security
- **Alternative**: `BIGSERIAL` for simpler sequential keys
- **Never**: `INTEGER` or `SERIAL` for primary keys in new tables (insufficient range)

### Common Data Types

#### Identifiers
- `UUID`: Primary keys, external identifiers
- `BIGINT`: Large counters, timestamps (epoch microseconds)
- `INTEGER`: Smaller counters, quantities, small IDs
- `SMALLINT`: Very small values, flags, enumerated ranges
- `VARCHAR(n)`: Variable-length text with reasonable limit
- `TEXT`: Unlimited text (for descriptions, notes, etc.)

#### Financial Data
- `NUMERIC(precision, scale)` or `DECIMAL(precision, scale)`: Exact monetary values
  - Amounts: `NUMERIC(20, 2)` for rupiah values
  - Percentages: `NUMERIC(5, 4)` for precise percentage calculations (e.g., 0.1234 for 12.34%)
  - Ratios: `NUMERIC(10, 6)` for precise ratio calculations
- **Never**: `FLOAT`, `REAL`, `DOUBLE PRECISION` for monetary values (floating point inaccuracies)

#### Temporal Data
- `TIMESTAMP WITH TIME ZONE`: All timestamps storing point-in-time events
- `DATE`: Date-only values (birth dates, effective dates)
- `TIME`: Time-of-day values (rarely used alone)
- `INTERVAL`: Time durations
- **Never**: `TIMESTAMP WITHOUT TIME ZONE` (ambiguous in distributed systems)

#### Boolean and Enum Data
- `BOOLEAN`: True/false values
- `VARCHAR(20)` or `TEXT`: For enumerated values with descriptive names
- **Alternative**: Create `DOMAIN` types for reusable enums
- **Avoid**: ENUM types unless values are truly static and limited (migration difficulties)

#### Special Types
- `JSONB`: For flexible, schema-less data (preferences, configurations, dynamic attributes)
- `TSVECTOR`: For full-text search
- `UUID`: As discussed
- `INET` or `CIDR`: For IP address storage
- `MACADDR`: For MAC addresses
- `POINT`, `LINE`, `LSEG`, `BOX`, `PATH`, `POLYGON`, `CIRCLE`: For geometric data (if needed)

### Column Constraints

#### Nullability
- `NOT NULL`: For fields that must always have a value
- `NULL`: For optional fields
- **Policy**: Minimize nullable columns; use meaningful defaults when appropriate

#### Default Values
- `DEFAULT`: For automatic values when not provided
- Common defaults:
  - `created_at`: `CURRENT_TIMESTAMP`
  - `updated_at`: `CURRENT_TIMESTAMP`
  - `is_active`: `TRUE`
  - `status`: `'DRAFT'` or `'PENDING'` (appropriate initial state)
  - `uuid`: `gen_random_uuid()` (requires pgcrypto extension)
  - `version`: `1` (for optimistic locking)

#### Check Constraints
Use `CHECK` constraints to enforce data integrity:
- Range validation: `CHECK (usia >= 17 AND usia <= 100)`
- Value validation: `CHECK (jenis_kelamin IN ('L', 'P'))`
- Format validation: `CHECK (email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')`
- Consistency validation: `CHECK (tanggal_akhir >= tanggal_awal)`
- Business rule validation: `CHECK (jumlah_pinjaman >= 1000000 AND jumlah_pinjaman <= 1000000000)`

#### Unique Constraints
Use `UNIQUE` constraints for business keys that must be unique:
- National ID (NIK): `UNIQUE (nik)`
- Email: `UNIQUE (email)` (if used as login)
- Username: `UNIQUE (username)`
- Account number: `UNIQUE (nomor_rekening)`
- Composite keys when needed: `UNIQUE (debitur_id, tanggal)` for spouse relationship)

## Indexing Strategy

### Index Types
- **B-tree**: Default for equality and range queries
- **Hash**: For equality-only queries (less commonly used)
- **GiST**: For geometric data and full-text search
- **GIN**: For JSONB, arrays, and full-text search
- **SP-GiST**: For specialized data types
- **BRIN**: For very large tables with natural ordering (time series)

### Indexing Guidelines
1. **Primary Key**: Always indexed (automatically)
2. **Foreign Key**: Always index foreign key columns for JOIN performance
3. **Where Clauses**: Index columns frequently used in WHERE conditions
4. **Join Columns**: Index columns used in JOIN conditions
5. **Order By**: Index columns used in ORDER BY when sorting large result sets
6. **Group By**: Index columns used in GROUP BY clauses
7. **Composite Indexes**: Create for queries that filter on multiple columns together
8. **Covering Indexes**: Include additional columns in INDEX to avoid heap lookups (INCLUDE clause)
9. **Partial Indexes**: For indexes that only need to cover a subset of data
10. **Expression Indexes**: For indexes on function results or expressions

### Specific Index Recommendations
- **Lookup Fields**: Index on commonly searched fields (nama, nomor_identitas, email)
- **Date Ranges**: Index on date fields used for range queries (tanggal_pengajuan, tanggal_akses)
- **Status Fields**: Consider partial indexes for active records only (WHERE status = 'AKTIF')
- **JSONB Fields**: Use GIN index for querying within JSONB documents
- **Full Text Search**: Use GIN or GiST index on tsvector columns
- **Foreign Keys**: Always index foreign key columns
- **Composite Keys**: Index ordering matters - put most selective column first

### Index Maintenance
- Monitor index usage with `pg_stat_user_indexes`
- Remove unused or rarely used indexes
- Reindex periodically for bloat reduction
- Consider fillfactor for tables with frequent updates

## Partitioning Strategy

### When to Partition
- Tables exceeding 10-20 million rows
- Tables with clear time-based access patterns (most queries touch recent data)
- Tables with different access patterns for historical vs. current data
- Tables requiring different storage characteristics per partition

### Partitioning Methods
- **Range Partitioning**: Most common for time-series data
- **List Partitioning**: For categorical data with known values
- **Hash Partitioning**: For even distribution when no natural partitioning key

### Partitioning Candidates
- `audit_logs`: Partition by month or quarter
- `pembayaran`: Partition by year or quarter
- `monitoring`: Partition by month
- `aktivitas` or `log` tables: Partition by day/week/month

### Partitioning Implementation
- Declarative partitioning (PostgreSQL 10+)
- Partition key: Usually date column (e.g., `created_at::date`)
- Partition naming: `{parent_table}_y{year}_m{month}` or similar
- Automatic partition creation: Through trigger or scheduled job
- Retention policy: Automatic dropping of old partitions

### Query Considerations with Partitioning
- Ensure queries include partition key for partition elimination
- Avoid functions on partition key in WHERE clauses (prevents partition elimination)
- Consider default partition for catching edge cases
- Monitor constraint exclusion in EXPLAIN plans

## Security

### Authentication
- Use strong passwords or certificate authentication
- Consider LDAP/Active Directory integration for enterprise environments
- Implement password complexity and expiration policies
- Use connection limits per user/database

### Authorization
- Principle of least privilege: Grant minimum necessary permissions
- Use roles/groups for permission management
- Separate roles for:
  - Application read/write
  - Reporting/read-only
  - Administration/DDL
  - Backup/restore
  - Monitoring
- Avoid granting direct table access to application users; use views where appropriate
- Consider row-level security (RLS) for multi-tenant scenarios

### Data Protection
- **Encryption at Rest**: 
  - Use filesystem encryption (LUKS, BitLocker, etc.)
  - Consider PostgreSQL Transparent Data Encryption (TDE) solutions
  - For sensitive fields: application-level encryption before storage
- **Encryption in Transit**: 
  - Force SSL/TLS for all connections
  - Use strong cipher suites
  - Disable outdated protocols (SSLv2/v3, TLS 1.0/1.1)
- **Data Masking**:
  - Implement dynamic data masking for sensitive fields in non-production
  - Consider static data masking for database copies
- **Field-Level Encryption**:
  - Encrypt highly sensitive fields (NIK, account numbers, etc.)
  - Use deterministic equality-preserving encryption when search needed
  - Use probabilistic encryption when search not required

### Auditing
- Enable `pgaudit` or similar for comprehensive logging
- Audit connections, disconnections, and SQL statements
- Log privileged access and configuration changes
- Secure audit logs with restricted access
- Regular audit log review and retention

### Vulnerability Management
- Regular security updates for PostgreSQL and OS
- Vulnerability scanning of database configurations
- Penetration testing of database access
- Review of excessive privileges
- Monitoring for anomalous access patterns

## Backup and Recovery

### Backup Strategy
- **Physical Base Backups**: 
  - Weekly base backup using `pg_basebackup` or file system snapshot
  - Retain 4 weeks of backups
- **Write-Ahead Log (WAL) Archiving**:
  - Continuous archiving of WAL segments
  - Archive to secure, separate storage location
  - Maintain 2 days of WAL segments in active archive
- **Point-in-Time Recovery (PITR)**:
  - Ability to restore to any point within retention window
  - Test recovery procedures quarterly
- **Logical Backups**:
  - Nightly logical dumps of critical schemas using `pg_dump`
  - Weekly full logical dump
  - Retain monthly logs for 3 months, quarterly for 1 year
  - Store in compressed format

### Recovery Objectives
- **Recovery Time Objective (RTO)**: 4 hours for complete site failure
- **Recovery Point Objective (RPO)**: 15 minutes of data loss maximum
- **Test Frequency**: 
  - Monthly: Restore latest backup to test environment
  - Quarterly: Full disaster recovery drill
  - Biannual: Test PITR to specific point in time

### Replication and High Availability
- **Streaming Replication**: 
  - At least one synchronous standby for zero data loss
  - One or more asynchronous standbys for read scaling and geographic distribution
- **Geographic Replication**:
  - Consider logical decoding for cross-region replication
  - Use tools like pglogical or Bucardo for multi-master if needed
- **Failover Procedures**:
  - Automated failover with repmgr or Patroni
  - Manual failover procedures documented and tested
  - Application connection routing updated automatically

## Performance Optimization

### Query Optimization
- Use `EXPLAIN ANALYZE` to understand query plans
- Ensure proper indexing for WHERE, JOIN, ORDER BY, GROUP BY clauses
- Avoid SELECT *; specify only needed columns
- Use appropriate JOIN types (INNER, LEFT, RIGHT, FULL)
- Consider CTEs (WITH clauses) for complex queries
- Limit result sets with LIMIT/OFFSET or keyset pagination
- Use EXISTS instead of IN for subqueries when appropriate
- Avoid functions on indexed columns in WHERE clauses
- Consider materialized views for expensive, frequently-run aggregations

### Connection Management
- Use connection pooling (PgBouncer, pgpool-II, or application-level)
- Tune pool size based on workload and database max_connections
- Implement connection timeouts and idle connection cleanup
- Use prepared statements where beneficial
- Statement caching in application layer

### Memory Configuration
- `shared_buffers`: 25% of system RAM (up to 32GB limit)
- `effective_cache_size`: 50-70% of system RAM
- `work_mem`: 4-16MB per operation (based on concurrent sort/hash operations)
- `maintenance_work_mem`: 256MB-1GB for VACUUM, CREATE INDEX
- `wal_buffers`: 16MB (min) to 1GB (max)
- `checkpoint_completion_target`: 0.9
- `max_worker_processes`: Number of CPU cores
- `max_parallel_workers_per_gather`: 2-4
- `max_parallel_workers`: Number of CPU cores
- `max_parallel_maintenance_workers`: 2-4

### Storage Optimization
- **Table Storage**:
  - Use appropriate fillfactor for tables with frequent updates (70-90%)
  - Consider TOAST management for large fields
  - Monitor and manage bloat with VACUUM
  - Use CLUSTER or pg_repack for important tables when needed
- **Index Storage**:
  - Monitor index bloat
  - Reindex periodically
  - Consider index-only scans with appropriate INCLUDE clauses
- **Tablespace Management**:
  - Separate tablespaces for indexes and tables if beneficial
  - SSD for primary storage, HDD for archive/less frequently accessed
  - Consider partitioning tablespaces by usage pattern

### Maintenance
- **VACUUM**:
  - Autovacuum enabled and tuned appropriately
  - Monitor bloat with pgstattuple or similar
  - Manual VACUUM for heavily updated tables during maintenance windows
- **ANALYZE**:
  - Autovacuum handles statistics updates
  - Manual ANALYZE after significant data changes
- **REINDEX**:
  - Schedule during low-usage periods
  - Consider CONCURRENTLY for production indexes (with caveats)
- **Log Rotation**:
  - Rotate PostgreSQL logs regularly
  - Retain logs for troubleshooting and audit compliance
  - Centralize log aggregation (ELK, Splunk, etc.)

## Development Practices

### Migrations
- Use migration tool (Flyway, Liquibase, Alembic, or custom)
- **Versioning**: Timestamp-based or sequential numbering
- **Naming**: `V{version}__description.sql` or `{sequence}_description.sql`
- **Content**:
  - Single logical change per migration
  - Include both UP and DOWN migrations when possible
  - Test migrations on copy of production data
  - Wrap in transactions when appropriate
  - Include documentation/comments
- **Execution**:
  - Automated in CI/CD pipeline
  - Manual approval for production deployments
  - Rollback tested and verified
  - Backup performed before migration

### Schema Changes
- **Backward Compatibility**:
  - Add new columns as NULLable with defaults
  - Avoid removing columns in same version; deprecate first
  - Rename columns via add new + copy data + drop old (with downtime planning)
  - Changing data types: add new column, migrate, switch, old column remove
- **Breaking Changes**:
  - Coordinate with application release
  - Provide feature flags for gradual rollout
  - Communicate clearly to all stakeholders
- **Testing**:
  - Unit test migration scripts
  - Integration test with application
  - Performance test with production-like data volume
  - Verify rollback procedures

### Query Writing
- **Readability**:
  - Use consistent formatting (INDENT, uppercase keywords)
  - Use table aliases meaningfully (t1, t2 or meaningful aliases)
  - Format complex queries with CTEs (WITH clauses)
  - Comment complex logic
- **Performance**:
  - Avoid SELECT *
  - Use LIMIT for queries that might return large result sets
  - Prefer JOIN over subqueries when possible
  - Use EXISTS instead of IN for subqueries with large result sets
  - Avoid functions on indexed columns in WHERE clauses
  - Consider query hints only as last resort
- **Security**:
  - Use parameterized queries/prepared statements
  - Never concatenate user input into SQL strings
  - Validate and sanitize all inputs
  - Implement proper error handling (don't expose SQL errors to users)

### Testing
- **Unit Testing**:
  - Test stored procedures and functions
  - Use frameworks like pgTAP
  - Mock dependencies when necessary
- **Integration Testing**:
  - Test against copy of production schema
  - Use transactional tests that rollback
  - Test boundary conditions and edge cases
- **Performance Testing**:
  - Test with production-equivalent data volumes
  - Measure query execution times under load
  - Test concurrent access patterns
- **Security Testing**:
  - Test for SQL injection vulnerabilities
  - Verify access controls
  - Check for information leakage in error messages

## Monitoring and Observability

### Metrics to Collect
- **Connection Metrics**:
  - Active connections
  - Idle connections
  - Connection wait times
  - Connection rejected due to max_connections
- **Query Performance**:
  - Slow query log (threshold: 1 second)
  - Average query execution time
  - 95th percentile query execution time
  - Rows returned vs. rows examined ratio
  - Index hit ratio
  - Cache hit ratio (shared buffers)
- **Resource Utilization**:
  - CPU utilization
  - Memory utilization
  - Disk I/O (read/write throughput, latency)
  - Disk space usage
  - WAL generation rate
- **Replication Metrics** (if applicable):
  - Replication lag (in bytes and time)
  - Streaming status
  - Receive/replay lag
- **Transaction Metrics**:
  - Transactions per second
  - Rollback rate
  - Deadlock frequency
  - Lock wait times
- **Background Processes**:
  - Autovacuum activity
  - Checkpoint frequency and duration
  - Background writer activity

### Logging
- **Log Levels**:
  - `error`: Errors that require immediate attention
  - `warning`: Conditions that might lead to errors
  - `info`: Informational messages of interest to administrators
  - `debug`: Detailed information for troubleshooting
  - `log`: Informational messages for general usage
- **Configuration**:
  - `log_destination`: 'stderr' (for containerized) or csvlog
  - `logging_collector`: on
  - `log_directory`: 'pg_log'
  - `log_filename`: 'postgresql-%Y-%m-%d_%H%M%S.log'
  - `log_truncate_on_rotation`: off
  - `log_rotation_age`: 1d
  - `log_rotation_size`: 10MB
  - `log_min_duration_statement`: 1000ms (log slow queries)
  - `log_line_prefix`: '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
  - `log_checkpoints`: on
  - `log_connections`: on
  - `log_disconnections`: on
  - `log_lock_waits`: on
  - `log_temp_files`: 0 (log all temporary file usage)
  - `log_lock_waits`: on
  - `log_autovacuum_min_duration`: 0 (log all autovacuum activity)
  - `log_statement`: 'none' (or 'ddl' for change tracking)
- **Log Monitoring**:
  - Centralized log collection (ELK, Fluentd, etc.)
  - Alerting on error patterns
  - Regular log review for anomalies

### Alerting Thresholds
- **Critical** (Page immediately):
  - Database unavailable
  - Connection exhaustion (>95% of max_connections used)
  - Replication lag > 5 minutes (for synchronous standby)
  - Data loss detected
  - Disk space < 5% remaining
- **Warning** (Notify within 15 minutes):
  - CPU usage > 85% for 5 minutes
  - Memory usage > 90%
  - Slow query rate > 1% of total queries
  - Deadlocks > 5 per minute
  - Replication lag > 1 minute (asynchronous)
  - Long-running transactions > 30 minutes
  - Autovacuum not keeping up with write rate
- **Info** (Log for review):
  - New slow queries detected
  - Index usage changes
  - Schema changes
  - Backup success/failure
  - Failed login attempts

## Environment-Specific Considerations

### Development
- **Database**: Separate instance or schema per developer or feature branch
- **Data**: Masked or synthetic data; never copy production PII without masking
- **Migrations**: Applied frequently; experimental changes encouraged
- **Performance**: Less critical; focus on correctness
- **Security**: Reduced but still following basic principles

### Testing / QA
- **Database**: Shared environment with refresh cycles
- **Data**: Production copy with PII masked/scrubbed
- **Migrations**: Thoroughly tested against production-like data volume
- **Performance**: Load testing with realistic volumes
- **Security**: Penetration testing and vulnerability scanning

### Staging / Pre-Production
- **Database**: Near-identical to production
- **Data**: Recent production copy with PII masked
- **Migrations**: Final validation before production
- **Performance**: Performance benchmarking against SLAs
- **Security**: Final security review

### Production
- **Database**: Optimized for performance and reliability
- **Data**: Real production data with full security controls
- **Migrations**: Strict change control; minimal downtime approaches
- **Performance**: Continuously monitored and optimized
- **Security**: Maximum controls; regular audits and penetration testing

## Compliance and Governance

### Data Retention
- Define retention periods per data type based on:
  - Legal requirements (OJK, tax law, etc.)
  - Business needs
  - Storage costs
- Implement automated archiving/purging processes
- Maintain audit trail of deletion activities
- Consider legal hold capabilities for litigation

### Data Privacy
- Identify and classify personal data (PII)
- Implement data minimization principles
- Provide mechanisms for data subject access requests (DSAR)
- Implement right to be forgotten procedures
- Conduct regular privacy impact assessments (PIA)

### Regulatory Reporting
- Ensure data needed for OJK, BI, and other regulator reports is available
- Implement data quality controls for regulatory fields
- Maintain data lineage for critical reporting elements
- Prepare for regulatory examinations with documentation

### Audit Trails
- Capture who, what, when, where, and why for all sensitive operations
- Ensure audit logs are immutable and tamper-evident
- Regularly review audit logs for anomalous activity
- Protect audit logs with strict access controls
- Retain audit logs per regulatory requirements

## Tools and Ecosystem

### Administration Tools
- **Primary**: psql (command line)
- **GUI**: pgAdmin, DBeaver, DataGrip
- **Monitoring**: pg_stat_statements, pgBadger, Prometheus + Grafana
- **Backup**: pgBackRest, Barman, wal-e
- **Replication**: repmgr, Patroni, PostgreSQL native streaming
- **Connection Pooling**: PgBouncer, pgpool-II
- **Migration**: Flyway, Liquibase, Alembic, dbmate
- **Testing**: pgTAP, pg_prove
- **Debugging**: EXPLAIN, EXPLAIN ANALYZE, pg_stat_kcache
- **Extensions**: 
  - Essential: pgcrypto, uuid-ossp, postgis (if needed), hstore, jsonb
  - Useful: btree_gist, btree_gin, intarray, isn, earthdistance, cube
  - Administrative: pg_stat_statements, pg_buffercache, pg_freespace, pgstattuple
  - Analytical: tablefunc, cube, dict_xsyn, fuzzystrmatch, pg_trgm
  - Procedural: plpgs: plpgsql (built-in), plperl, plpythonu, pltcl

### Cloud Considerations
- **Managed Services**: 
  - Amazon RDS/Aurora PostgreSQL
  - Google Cloud SQL for PostgreSQL
  - Azure Database for PostgreSQL
  - Crunchy Bridge
  - Timescale Cloud (for time-series workloads)
- **Configuration Differences**:
  - Limited superuser access
  - Modified backup procedures
  - Different monitoring approaches
  - VPC/network considerations
- **Vendor Lock-in Mitigation**:
  - Use standard SQL where possible
  - Avoid vendor-specific features when alternatives exist
  - Maintain ability to migrate to self-managed or other cloud

## Change Management Process

### Proposal
1. **Issue Identification**: Document problem or opportunity
2. **Impact Analysis**: Assess effects on performance, storage, compatibility
3. **Solution Design**: Detailed technical approach
4. **Risk Assessment**: Identify risks and mitigation strategies
5. **Resource Estimation**: Effort, timeline, testing requirements

### Approval
1. **Technical Review**: Architecture, database, security teams review
2. **Business Review**: Product owners, stakeholders validate need
3. **Risk Review**: Security, compliance, operations assess risks
4. **Final Approval**: Change Advisory Board (CAB) or equivalent

### Implementation
1. **Preparation**:
   - Backup taken and verified
   - Rollback plan documented and tested
   - Communication sent to stakeholders
   - Maintenance window scheduled
2. **Execution**:
   - Apply changes according to plan
   - Monitor closely during and after
   - Execute verification steps
3. **Validation**:
   - Smoke tests
   - Functional tests
   - Performance validation
   - User acceptance testing
4. **Communication**:
   - Status updates during implementation
   - Completion notification
   - Post-implementation review scheduling

### Post-Implementation
1. **Monitoring**:
   - Enhanced monitoring for 24-48 hours
   - Key metric comparison to baseline
   - Error rate tracking
2. **Documentation**:
   - Update architecture diagrams
   - Update runbooks
   - Update procedures
   - Document lessons learned
3. **Review**:
   - Post-implementation review meeting
   - Identify improvement areas
   - Update change management process if needed

## Appendix A: Recommended Table Definitions

### Core Tables (Examples)

```sql
-- debitur table
CREATE TABLE debitur (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nik VARCHAR(16) NOT NULL UNIQUE,
    nama VARCHAR(100) NOT NULL,
    tanggal_lahir DATE NOT NULL,
    jenis_kelamin CHAR(1) NOT NULL CHECK (jenis_kelamin IN ('L', 'P')),
    alamat TEXT,
    rt_rw VARCHAR(10),
    kelurahan VARCHAR(50),
    kecamatan VARCHAR(50),
    kota_kabupaten VARCHAR(50),
    provinsi VARCHAR(50),
    kode_pos VARCHAR(5),
    telepon VARCHAR(20),
    email VARCHAR(100),
    pekerjaan VARCHAR(100),
    pendapatan_perbulan NUMERIC(15, 2),
    status_perkawinan VARCHAR(20) CHECK (status_perkawinan IN ('BELUM_KAWIN', 'KAWIN', 'CERAI_HIDUP', 'CERAI_MATI')),
    jumlah_tanggungan INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_debitur_nama ON debitur(nama);
CREATE INDEX idx_debitur_email ON debitur(email);
CREATE INDEX idx_debitur_created_at ON debitur(created_at);

-- pengajuan table
CREATE TABLE pengajuan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    debitur_id UUID NOT NULL REFERENCES debitur(id) ON DELETE RESTRICT,
    produk_id UUID NOT NULL REFERENCES produk(id) ON DELETE RESTRICT,
    jumlah_pinjaman NUMERIC(15, 2) NOT NULL CHECK (jumlah_pinjaman > 0),
    tenor INTEGER NOT NULL CHECK (tenor > 0 AND tenor <= 360),
    tujuan TEXT,
    tanggal_pengajuan DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'DIAJUKAN', 'DIVERIFIKASI', 'DI_SURVEY', 'DI_ANALIS', 'DI_UNDERWRITING', 'DI_KOMITE', 'DISETUJUI', 'DITOLAK', 'DICABUT')),
    nilai_tukar NUMERIC(15, 2),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_pengajuan_debitur_id ON pengajuan(debitur_id);
CREATE INDEX idx_pengajuan_produk_id ON pengajuan(produk_id);
CREATE INDEX idx_pengajuan_status ON pengajuan(status);
CREATE INDEX idx_pengajuan_tanggal_pengajuan ON pengajuan(tanggal_pengajuan);
CREATE INDEX idx_pengajuan_debitur_status ON pengajuan(debitur_id, status);
```

### Audit Table Pattern

```sql
-- audit_logs table in audit schema
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    operation VARCHAR(10) NOT NULL CHECK (operation IN ('CREATE', 'READ', 'UPDATE', 'DELETE')),
    old_values JSONB,
    new_values JSONB,
    changed_by UUID NOT NULL REFERENCES users(id),
    changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(100),
    reason TEXT
);

-- Indexes for audit logs
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(changed_at);
CREATE INDEX idx_audit_logs_user ON audit_logs(changed_by);
CREATE INDEX idx_audit_logs_operation ON audit_logs(operation);
```

## Appendix B: Recommended Extensions

### Essential Extensions
```sql
-- Create extensions if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";  -- For UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- For cryptographic functions
CREATE EXTENSION IF NOT EXISTS "btree_gin";  -- For GIST/GIN indexes on scalar types
CREATE EXTENSION IF NOT EXISTS "btree_gist"; -- For GIST indexes on scalar types
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- For trigram matching (text search)
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements"; -- For query performance monitoring
```

### Useful Extensions (Add as Needed)
```sql
-- Spatial data (if needed for location analysis)
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Full text search dictionaries
CREATE EXTENSION IF NOT EXISTS "unaccent";   -- For accent-insensitive search
CREATE EXTENSION IF NOT EXISTS "dict_xsyn";  -- For synonym dictionaries
CREATE EXTENSION IF NOT EXISTS "fuzzystrmatch"; -- For fuzzy matching

-- Mathematical functions
CREATE EXTENSION IF NOT EXISTS "cube";       -- For multi-dimensional cubes
CREATE EXTENSION IF NOT EXISTS "earthdistance"; -- For earth distance calculations

-- Financial calculations
CREATE EXTENSION IF NOT EXISTS "financial";  -- Financial functions (if available)

-- UUID variants
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- Already listed above for gen_random_uuid()

-- Table partitioning utilities
CREATE EXTENSION IF NOT EXISTS "partman";    -- Partition management (pg_partman)

-- Connection pooling info
CREATE EXTENSION IF NOT EXISTS "pgbouncer";  -- If using PgBouncer locally for testing
```

## Appendix C: Sample Configuration Parameters

### postgresql.conf Settings
```conf
# CONNECTIONS AND AUTHENTICATION
listen_addresses = '*'
max_connections = 100
superuser_reserved_connections = 3
unix_socket_directories = '/var/run/postgresql'

# MEMORY
shared_buffers = 4GB
huge_pages = try
temp_file_limit = -1
work_mem = 16MB
maintenance_work_mem = 256MB
wal_buffers = 16MB
min_wal_size = 1GB
max_wal_size = 4GB

# CHECKPOINT
checkpoint_timeout = 15min
checkpoint_completion_target = 0.9
max_wal_size = 4GB
min_wal_size = 1GB

# QUERY TUNING
default_statistics_target = 100
constraint_exclusion = partition
cursor_tuple_fraction = 0.1
from_limit = 10
geqo = on
geqo_threshold = 12
geqo_effort = 5
geqo_pool_size = 0
geqo_generations = 0
geqo_selection_bias = 2.0
geqo_seed = 0.0
join_collapse_limit = 8
from_collapse_limit = 8

# ERROR REPORTING
log_destination = 'stderr'
logging_collector = on
log_directory = 'pg_log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_truncate_on_rotation = off
log_rotation_age = 1d
log_rotation_size = 10MB
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on
log_temp_files = 0
log_autovacuum_min_duration = 0
log_min_duration_statement = 1000ms
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '

# AUTOVACUUM
autovacuum = on
log_autovacuum = on
autovacuum_max_workers = 3
autovacuum_naptime = 1min
autovacuum_vacuum_cost_delay = 2ms
autovacuum_vacuum_cost_limit = -1

# CLIENT CONNECTION DEFAULTS
search_path = '"$user", public'
default_tablespace = ''
temp_tablespaces = ''
default_transaction_isolation = 'read committed'
default_transaction_read_only = off
default_transaction_deferrable = off
session_replication_role = 'origin'
statement_timeout = 0
lock_timeout = 0
idle_in_transaction_session_timeout = 0
```

### PgBouncer Configuration (if used)
```ini
[databases]
* = host=db-host port=5432

[pgbouncer]
listen_addr = *
listen_port = 6432
auth_type = md5
auth_file = userlist.txt
admin_users = someadmin
pool_mode = transaction
max_client_conn = 100
default_pool_size = 20
reserve_pool_size = 0
reserve_pool_timeout = 5
query_timeout = 0
query_wait_timeout = 120
client_idle_timeout = 0
idle_transaction_timeout = 0
```

---
*Document ini adalah bagian dari Living Specification untuk Sistem Analisa Kredit PT BPR BAPERA BATANG. 
Diperbarui terakhir: 2026-06-27*