# DEPLOYMENT.md

# Deployment Guide - Sistem Analisa Kredit PT BPR BAPERA BATANG

## Overview
This document provides comprehensive deployment guidelines for the Credit Analysis System. It covers environment setup, deployment procedures, configuration management, and operational best practices for deploying and maintaining the system in various environments.

## Environment Strategy

### Environment Types

#### 1. Development Environment
- **Purpose**: Feature development and unit testing
- **Database**: Local PostgreSQL instance or Docker container
- **Storage**: Local MinIO or mock storage
- **AI Services**: Local llama-server instances
- **Users**: Development team
- **Data**: Synthetic or masked data

#### 2. Integration/QA Environment
- **Purpose**: Integration testing and QA validation
- **Database**: Shared PostgreSQL (refresh from production weekly)
- **Storage**: Shared MinIO
- **AI Services**: Shared llama-server instances
- **Users**: QA team, developers
- **Data**: Anonymized production data

#### 3. Staging Environment
- **Purpose**: Pre-production validation and UAT
- **Database**: Near-production PostgreSQL
- **Storage**: Production-like MinIO
- **AI Services**: Production-like configuration
- **Users**: Business users, stakeholders
- **Data**: Recent anonymized production snapshot

#### 4. Production Environment
- **Purpose**: Live system serving real users
- **Database**: Production PostgreSQL with HA
- **Storage**: Production MinIO with backup
- **AI Services**: Production llama-server instances
- **Users**: All authorized users
- **Data**: Real production data

## Prerequisites

### Hardware Requirements

#### Development (per developer)
- CPU: 8+ cores
- RAM: 16GB+ (32GB recommended for AI features)
- Storage: 500GB SSD
- GPU: Optional (for local AI model testing)

#### Staging/Production (minimum)
- **Application Servers** (minimum 2 for HA):
  - CPU: 8+ cores
  - RAM: 16GB+
  - Storage: 200GB SSD
  
- **Database Server**:
  - CPU: 16+ cores
  - RAM: 32GB+
  - Storage: 1TB+ SSD (with replication)
  
- **AI/LLM Server** (if on-premise):
  - CPU: 16+ cores
  - RAM: 64GB+
  - GPU: NVIDIA RTX 3090/4090 or A10/A100 for production
  - Storage: 500GB NVMe SSD

#### Network
- 1Gbps minimum network
- Low latency between application and database (< 1ms)
- Sufficient bandwidth for document storage/retrieval

### Software Dependencies

- Docker 20.10+
- Docker Compose 2.0+
- Node.js 18+ LTS
- PostgreSQL 15+
- MinIO (or compatible S3 storage)
- Nginx
- Git
- SSL certificates

## Deployment Architecture

### Production Architecture

```
Internet
    |
    v
[ Nginx Load Balancer ]
    |
    +---> [ Frontend (Vite) ] ---> [ Nginx Static ]
    |
    +---> [ Backend API ] ---> [ Node.js/Express ]
    |         |
    |         +---> [ PostgreSQL Primary ]
    |         |         |
    |         |         +---> [ PostgreSQL Replica ]
    |         |
    |         +---> [ MinIO ]
    |         |
    |         +---> [ llama-server:1976 ] (VLM)
    |         +---> [ llama-server:1977 ] (Embedding)
    |         +---> [ llama-server:1978 ] (LLM)
    |
    +---> [ Monitoring ]
          (Prometheus + Grafana)
```

### High Availability Considerations
- Multiple backend instances behind load balancer
- PostgreSQL streaming replication
- MinIO with erasure coding
- Redundant llama-server instances
- Automated failover for critical components

## Deployment Methods

### Method 1: Docker Compose (Recommended for SMB)

#### Prerequisites
- Docker and Docker Compose installed
- SSL certificates ready
- Environment configuration files

#### Steps
1. Clone repository to server
2. Configure environment variables
3. Run database migrations
4. Start services with Docker Compose
5. Verify health checks
6. Configure SSL/TLS
7. Set up monitoring

### Method 2: Kubernetes (For Enterprise Scale)

#### Prerequisites
- Kubernetes cluster (EKS, GKE, AKS, or on-premise)
- kubectl configured
- Helm charts prepared

#### Steps
1. Package applications as Docker images
2. Push images to registry
3. Deploy using Helm charts
4. Configure ingress and TLS
5. Set up monitoring and logging
6. Configure auto-scaling

## Configuration Management

### Environment Variables
All sensitive configuration stored in environment variables:
- Database connection strings
- JWT secrets
- Encryption keys
- API keys
- MinIO credentials
- External service URLs

### Configuration Files
```
config/
├── development/
│   ├── .env
│   └── config.json
├── staging/
│   ├── .env
│   └── config.json
└── production/
    ├── .env
    └── config.json
```

### Secrets Management
- Development: .env files (git-ignored)
- Staging/Production: HashiCorp Vault or AWS Secrets Manager
- Rotation schedule: Every 90 days
- Emergency rotation procedure

## Deployment Procedures

### Pre-Deployment Checklist
- [ ] Code review completed and approved
- [ ] All tests passing
- [ ] Security scan completed
- [ ] Database migration tested
- [ ] Documentation updated
- [ ] Rollback plan prepared
- [ ] Change approval obtained
- [ ] Maintenance window scheduled (if needed)
- [ ] Stakeholders notified

### Deployment Steps (Docker Compose)

#### 1. Preparation
```bash
# Pull latest code
git pull origin main

# Review changes
git log --oneline -10

# Check database migrations
ls -la backend/migrations/
```

#### 2. Build and Test
```bash
# Build all services
docker-compose build

# Run tests
docker-compose run --rm backend npm test
docker-compose run --rm frontend npm test

# Run linting
docker-compose run --rm backend npm run lint
docker-compose run --rm frontend npm run lint
```

#### 3. Database Migration
```bash
# Run migrations
docker-compose exec backend npm run migrate

# Verify migration
docker-compose exec backend npm run migrate:status
```

#### 4. Deploy
```bash
# Stop services gracefully
docker-compose down

# Start services
docker-compose up -d

# Verify all services are running
docker-compose ps

# Check logs for errors
docker-compose logs --tail=50
```

#### 5. Verification
```bash
# Health checks
curl https://api.example.com/health
curl https://example.com

# Database connectivity
docker-compose exec backend npm run db:test

# Smoke tests
npm run test:smoke
```

### Rollback Procedure
```bash
# Identify previous version
git tag -l
git log --oneline -20

# Rollback code
git checkout v1.x.x

# Rebuild and redeploy
docker-compose build
docker-compose down
docker-compose up -d

# Verify rollback
curl https://api.example.com/health
```

## Monitoring and Health Checks

### Application Health Checks
- `/health` - Overall application health
- `/health/db` - Database connectivity
- `/health/redis` - Redis connectivity (if used)
- `/health/minio` - MinIO connectivity
- `/health/ai` - AI services availability

### Monitoring Stack
- **Metrics**: Prometheus + Grafana
- **Logging**: ELK Stack (Elasticsearch, Logstash, Kibana)
- **Alerting**: Alertmanager or PagerDuty
- **Tracing**: Jaeger or Zipkin

### Key Metrics
- Request rate and latency
- Error rate
- Database connection pool usage
- Queue depth (if applicable)
- Disk and memory usage
- AI service response times

## Backup and Recovery

### Backup Strategy
- **Database**: Daily full backup + continuous WAL archiving
- **Files**: Daily backup of MinIO data
- **Configuration**: Version controlled in Git
- **Encryption**: Backups encrypted at rest

### Recovery Procedures
- Documented runbooks for common failure scenarios
- Regular disaster recovery drills (quarterly)
- RTO: 4 hours
- RPO: 15 minutes

## Security Hardening

### Server Hardening
- Disable unused services
- Configure firewall (ufw/iptables)
- Enable automatic security updates
- SSH key authentication only
- Fail2ban for brute force protection

### Application Hardening
- Non-root user in Docker containers
- Read-only filesystems where possible
- No secrets in environment variables (use secrets manager)
- Security headers in all responses
- Rate limiting on all endpoints

## Performance Optimization

### Database Optimization
- Connection pooling configured
- Query optimization
- Index tuning
- Regular VACUUM and ANALYZE
- Monitoring slow queries

### Application Optimization
- Response compression (gzip)
- Static asset caching
- CDN for frontend assets
- Database query optimization
- Connection pooling

### Caching Strategy
- Redis for session and frequent queries
- HTTP caching headers for static assets
- Application-level caching for expensive operations

## Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check PostgreSQL status
docker-compose exec db pg_isready -U postgres

# Check connection pool
docker-compose exec backend npm run db:pool-status

# Check active connections
docker-compose exec db psql -U postgres -c "SELECT * FROM pg_stat_activity;"
```

#### Memory Issues
```bash
# Check container memory usage
docker stats

# Check application memory
docker-compose exec backend npm run memory-usage

# Check for memory leaks
docker-compose exec backend npm run memory-profile
```

#### Performance Issues
```bash
# Check slow queries
docker-compose exec db psql -U postgres -c "SELECT * FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"

# Check application logs
docker-compose logs --tail=100 backend

# Check database performance
docker-compose exec db psql -U postgres -c "SELECT * FROM pg_stat_user_tables;"
```

## Maintenance

### Regular Maintenance Tasks

#### Daily
- Monitor error logs
- Check backup completion
- Review security alerts

#### Weekly
- Review slow query log
- Check disk space
- Review security logs

#### Monthly
- Apply security patches
- Review and optimize indexes
- Update dependencies (security patches)
- Capacity planning review

#### Quarterly
- Disaster recovery drill
- Security audit
- Performance tuning review
- Documentation review

### Patching Strategy
- Security patches: Within 7 days of release
- Minor version updates: Monthly
- Major version updates: Quarterly with testing

## Appendix A: Deployment Scripts

### deploy.sh
```bash
#!/bin/bash
set -e

echo "Starting deployment..."

# Pull latest code
git pull origin main

# Build images
docker-compose build

# Run migrations
docker-compose run --rm backend npm run migrate

# Restart services
docker-compose down
docker-compose up -d

# Wait for services
sleep 30

# Health check
curl -f https://api.example.com/health || exit 1

echo "Deployment completed successfully"
```

### rollback.sh
```bash
#!/bin/bash
set -e

echo "Starting rollback..."

# Get previous version
PREVIOUS_VERSION=$1

if [ -z "$PREVIOUS_VERSION" ]; then
  echo "Usage: ./rollback.sh <version>"
  exit 1
fi

git checkout $PREVIOUS_VERSION

docker-compose build
docker-compose down
docker-compose up -d

sleep 30

curl -f https://api.example.com/health || exit 1

echo "Rollback completed successfully"
```

## Appendix B: Monitoring Checklist

### Post-Deployment Monitoring (First 24 Hours)
- [ ] Error rate within acceptable limits
- [ ] Response times normal
- [ ] Database connections stable
- [ ] Disk space adequate
- [ ] Memory usage stable
- [ ] No unexpected errors in logs
- [ ] AI services responding
- [ ] Notifications sending successfully

### Weekly Review
- [ ] Review error logs for patterns
- [ ] Check database performance metrics
- [ ] Review security logs
- [ ] Verify backup completion
- [ ] Check certificate expiration dates

---
*Document ini adalah bagian dari Living Specification untuk Sistem Analisa Kredit PT BPR BAPERA BATANG. 
Diperbarui terakhir: 2026-06-27*