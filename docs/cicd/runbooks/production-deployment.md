# Production Deployment Runbook

Complete operational procedures for deploying the Case Management System to production environment.

## 🎯 Overview

This runbook covers the end-to-end production deployment process, including pre-deployment checks, deployment execution, validation, and rollback procedures.

**Deployment Strategy**: Blue-Green deployment with manual approval gates  
**Target MTTR**: <15 minutes for critical issues  
**Rollback SLA**: <5 minutes to initiate, <10 minutes to complete

## 📋 Pre-Deployment Checklist

### Code Readiness
- [ ] All tests passing in staging environment
- [ ] Code review completed and approved (minimum 2 reviewers)
- [ ] Security scan passed (no critical/high vulnerabilities)
- [ ] Performance tests passed (Lighthouse score ≥95)
- [ ] Database migrations tested and validated
- [ ] Feature flags configured (if applicable)

### Infrastructure Readiness
- [ ] Production environment health check passed
- [ ] Database backup completed and verified
- [ ] Monitoring systems operational
- [ ] On-call team notified of deployment window
- [ ] Rollback procedures validated
- [ ] Emergency contacts confirmed

### Business Readiness
- [ ] Stakeholders notified of deployment window
- [ ] User communications sent (if user-facing changes)
- [ ] Support team briefed on changes
- [ ] Business validation criteria defined

## 🚀 Deployment Process

### Phase 1: Pre-Deployment (15 minutes)

#### 1.1 Environment Validation
```bash
# Check production environment health
curl -f https://api.yourdomain.com/health
curl -f https://yourdomain.com/api/health

# Verify database connectivity
psql $PRODUCTION_DATABASE_URL -c "SELECT version(), current_timestamp;"

# Check Redis connectivity  
redis-cli -u $PRODUCTION_REDIS_URL ping

# Validate external services
curl -f https://api.sendgrid.com/v3/user/profile \
  -H "Authorization: Bearer $SENDGRID_API_KEY"
```

#### 1.2 Backup Creation
```bash
# Create database backup
pg_dump $PRODUCTION_DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql

# Backup uploaded files (if applicable)
aws s3 sync s3://$S3_BUCKET_NAME s3://$S3_BUCKET_NAME-backup-$(date +%Y%m%d)

# Verify backup integrity
psql $TEST_DATABASE_URL < backup-$(date +%Y%m%d-%H%M%S).sql
```

#### 1.3 Deployment Preparation
```bash
# Merge approved changes to main branch
git checkout main
git pull origin main
git merge --no-ff develop

# Tag the release
git tag -a v$(date +%Y.%m.%d) -m "Production deployment $(date +%Y-%m-%d)"
git push origin --tags

# Trigger production deployment workflow
gh workflow run "Backend CI/CD Pipeline" --ref main
gh workflow run "Frontend CI/CD Pipeline" --ref main
```

### Phase 2: Database Migration (10 minutes)

#### 2.1 Migration Execution
```bash
# Apply database migrations
npx prisma migrate deploy

# Verify migration success
npx prisma db execute --file=prisma/verification-queries.sql

# Update database statistics
psql $PRODUCTION_DATABASE_URL -c "ANALYZE;"
```

#### 2.2 Data Integrity Validation
```bash
# Run data integrity checks
npm run validate:data-integrity

# Check critical tables
psql $PRODUCTION_DATABASE_URL -c "
SELECT 
  table_name, 
  row_count 
FROM (
  SELECT 
    schemaname,
    tablename as table_name,
    n_tup_ins - n_tup_del as row_count
  FROM pg_stat_user_tables 
  WHERE schemaname = 'public'
) t 
ORDER BY row_count DESC;
"
```

### Phase 3: Application Deployment (20 minutes)

#### 3.1 Blue-Green Deployment
The deployment is automated via GitHub Actions but requires manual approval:

1. **GitHub Actions Workflow**:
   - Builds and tags new Docker images
   - Deploys to staging environment first
   - Runs smoke tests and health checks
   - Waits for manual approval for production

2. **Manual Approval Process**:
   ```bash
   # Review staging deployment
   curl -f https://staging.yourdomain.com/health
   
   # Review deployment changes
   gh pr view --web
   
   # Approve production deployment
   # (Done via GitHub Actions UI)
   ```

3. **Production Deployment**:
   - Updates production containers with zero downtime
   - Performs rolling restart of application instances
   - Validates health checks before switching traffic

#### 3.2 Traffic Switching
```bash
# Verify new version health
curl -f https://api.yourdomain.com/health
curl -f https://yourdomain.com/api/health

# Check application logs
kubectl logs -l app=case-management-backend --tail=100
kubectl logs -l app=case-management-frontend --tail=100

# Monitor error rates
# (Check Grafana dashboards for error metrics)
```

### Phase 4: Post-Deployment Validation (15 minutes)

#### 4.1 Functional Testing
```bash
# Run critical path tests
npm run test:critical-path

# Verify key functionality
curl -X POST https://api.yourdomain.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "testpass"}'

# Check file upload functionality
curl -X POST https://api.yourdomain.com/files/upload \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -F "file=@test-document.pdf"
```

#### 4.2 Performance Validation
```bash
# Run Lighthouse audit
npx lighthouse https://yourdomain.com \
  --output json \
  --output-path lighthouse-prod.json

# Check response times
curl -w "@curl-format.txt" -s https://api.yourdomain.com/cases

# Monitor key metrics
# - Response times <200ms
# - Error rate <1%
# - CPU usage <70%
# - Memory usage <80%
```

#### 4.3 Business Validation
- [ ] Login functionality working
- [ ] Case creation and assignment working
- [ ] File upload/download working
- [ ] Email notifications sending
- [ ] Reports generating correctly
- [ ] User permissions enforced

## 📊 Monitoring & Alerting

### Key Metrics to Monitor
```bash
# Error rate monitoring
curl https://api.yourdomain.com/metrics | grep error_rate

# Response time monitoring  
curl https://api.yourdomain.com/metrics | grep response_time

# Database performance
psql $PRODUCTION_DATABASE_URL -c "
SELECT 
  datname,
  numbackends,
  xact_commit,
  xact_rollback,
  tup_returned,
  tup_fetched
FROM pg_stat_database 
WHERE datname = 'case_management';
"
```

### Alert Thresholds
- **Critical**: Error rate >5%, Response time >1s, Database down
- **Warning**: Error rate >1%, Response time >500ms, CPU >80%
- **Info**: Deployment completion, Traffic patterns

## 🔄 Rollback Procedures

### Automatic Rollback Triggers
- Health check failures for >2 minutes
- Error rate >10% for >1 minute
- Critical service unavailability

### Manual Rollback Process

#### 1. Immediate Rollback (5 minutes)
```bash
# Identify previous stable version
git tag -l | tail -5

# Rollback to previous version
kubectl rollout undo deployment/case-management-backend
kubectl rollout undo deployment/case-management-frontend

# Verify rollback success
kubectl rollout status deployment/case-management-backend
kubectl rollout status deployment/case-management-frontend
```

#### 2. Database Rollback (if needed)
```bash
# WARNING: Only if absolutely necessary and data loss is acceptable

# Restore from backup
pg_restore -d $PRODUCTION_DATABASE_URL backup-$(date +%Y%m%d-%H%M%S).sql

# Run rollback migrations (if available)
npx prisma migrate reset --force --skip-seed
```

#### 3. Validation Post-Rollback
```bash
# Verify system health
curl -f https://api.yourdomain.com/health
curl -f https://yourdomain.com/api/health

# Check critical functionality
npm run test:smoke

# Monitor for 10 minutes to ensure stability
```

## 🚨 Emergency Procedures

### Production Down Scenario

1. **Immediate Response** (0-2 minutes):
   ```bash
   # Check system status
   curl -I https://yourdomain.com
   
   # Check infrastructure
   kubectl get pods
   kubectl get services
   
   # Notify team
   # Automatic n8n notification to #critical-alerts
   ```

2. **Incident Assessment** (2-5 minutes):
   - Identify root cause (application, database, infrastructure)
   - Determine impact scope (partial vs. complete outage)
   - Decide on rollback vs. forward fix

3. **Resolution** (5-15 minutes):
   - Execute rollback procedure if needed
   - Apply forward fix if safe and quick
   - Communicate status to stakeholders

### Data Corruption Scenario

1. **Immediate Actions**:
   ```bash
   # Stop all write operations
   kubectl scale deployment case-management-backend --replicas=0
   
   # Assess corruption scope
   npm run validate:data-integrity
   
   # Preserve current state
   pg_dump $PRODUCTION_DATABASE_URL > emergency-backup-$(date +%Y%m%d-%H%M%S).sql
   ```

2. **Recovery Process**:
   - Restore from latest clean backup
   - Replay transactions if possible
   - Validate data integrity
   - Restart services

## 📞 Emergency Contacts

### Immediate Response Team
- **On-Call Engineer**: Paged automatically via n8n
- **DevOps Lead**: Slack @devops-lead
- **Technical Lead**: Slack @tech-lead
- **Product Manager**: SMS for critical business impact

### Escalation Chain
1. **L1**: On-call engineer (0-15 minutes)
2. **L2**: DevOps team lead (15-30 minutes)  
3. **L3**: Engineering director (30+ minutes)
4. **L4**: CTO (critical business impact)

### External Contacts
- **AWS Support**: Enterprise support case
- **SendGrid Support**: Email delivery issues
- **CDN Provider**: Content delivery issues

## 📚 Reference Documentation

- [Pipeline Architecture](../pipeline-architecture.md)
- [Monitoring Guide](../monitoring.md)
- [Incident Response](./incident-response.md)
- [Database Runbook](./database-operations.md)
- [Security Procedures](./security-incident.md)

## ✅ Post-Deployment Tasks

### Immediate (within 1 hour)
- [ ] Monitor system metrics for anomalies
- [ ] Verify all notifications and alerts working
- [ ] Update deployment documentation
- [ ] Notify stakeholders of successful deployment

### Short-term (within 24 hours)
- [ ] Review deployment metrics and performance
- [ ] Gather user feedback on changes
- [ ] Update runbook with lessons learned
- [ ] Schedule retrospective meeting

### Long-term (within 1 week)
- [ ] Analyze deployment efficiency metrics
- [ ] Identify process improvements
- [ ] Update automation scripts if needed
- [ ] Share knowledge with team

---

**Last Updated**: 2024-01-31  
**Version**: 1.0.0  
**Owner**: DevOps Engineering Team  
**Review Schedule**: Monthly