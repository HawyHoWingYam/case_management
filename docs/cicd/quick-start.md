# CI/CD Quick Start Guide

Get the Case Management System CI/CD pipeline up and running in 15 minutes.

## 🎯 Prerequisites

### Required Tools
- **Git**: Version control system
- **Node.js**: Version 20 or higher
- **Docker**: For containerized development
- **GitHub CLI**: For secrets management (`gh` command)

### Access Requirements
- GitHub repository access with push permissions
- AWS account for S3 storage (production)
- SendGrid account for email notifications
- n8n instance for automation workflows

## ⚡ Quick Setup (5 minutes)

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone https://github.com/your-org/case_management.git
cd case_management

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies  
cd ../frontend && npm install

# Return to project root
cd ..
```

### 2. Environment Configuration

```bash
# Copy environment template
cp .env.example .env.development

# Start development services
docker-compose -f docker-compose.dev.yml up -d

# Wait for services to be ready (about 2 minutes)
docker-compose -f docker-compose.dev.yml ps
```

### 3. Database Setup

```bash
# Setup database migrations
cd backend
npx prisma migrate dev --name init
npx prisma db seed
cd ..
```

## 🔐 Secrets Configuration (5 minutes)

### Option A: Automated Setup (Recommended)

```bash
# Run the automated secrets setup script
./scripts/setup-secrets.sh

# Follow the interactive prompts to configure:
# - Database passwords
# - JWT secrets  
# - AWS S3 credentials
# - SendGrid API key
# - n8n webhook URL
```

### Option B: Manual Setup

```bash
# Set individual secrets via GitHub CLI
gh secret set DB_PASSWORD --body "your-secure-db-password"
gh secret set JWT_SECRET --body "$(openssl rand -base64 64)"
gh secret set AWS_ACCESS_KEY_ID --body "your-aws-access-key"
gh secret set AWS_SECRET_ACCESS_KEY --body "your-aws-secret-key"
gh secret set SENDGRID_API_KEY --body "your-sendgrid-api-key"
gh secret set N8N_WEBHOOK_URL --body "https://your-n8n-instance.com/webhook"

# Set environment-specific secrets
gh secret set DATABASE_URL --env staging --body "your-staging-db-url"
gh secret set DATABASE_URL --env production --body "your-production-db-url"
```

## 🧪 Test the Pipeline (5 minutes)

### 1. Create a Test Branch

```bash
# Create and switch to test branch
git checkout -b test/ci-cd-setup

# Make a small change
echo "# CI/CD Test" >> README.md
git add README.md
git commit -m "test: validate CI/CD pipeline setup"

# Push branch
git push -u origin test/ci-cd-setup
```

### 2. Create Pull Request

```bash
# Create PR via GitHub CLI
gh pr create \
  --title "test: CI/CD pipeline validation" \
  --body "Testing the CI/CD pipeline setup and configuration"

# Or create via GitHub web interface
```

### 3. Monitor Pipeline Execution

```bash
# Watch workflow status
gh run list --limit 5

# View specific workflow run  
gh run view <run-id>

# Check workflow logs
gh run view <run-id> --log
```

## ✅ Verification Checklist

Confirm these items are working correctly:

### GitHub Actions Workflows
- [ ] **Backend Pipeline**: Triggered by backend file changes
- [ ] **Frontend Pipeline**: Triggered by frontend file changes  
- [ ] **Database Pipeline**: Triggered by schema changes
- [ ] **n8n Automation**: Deployment notifications working

### Quality Gates
- [ ] **Linting**: ESLint passes for both backend and frontend
- [ ] **Type Checking**: TypeScript compilation successful
- [ ] **Testing**: All tests pass with ≥90% coverage
- [ ] **Security**: No critical vulnerabilities detected
- [ ] **Performance**: Lighthouse scores meet thresholds

### Notifications
- [ ] **Slack**: Deployment notifications appear in channels
- [ ] **Email**: Critical alerts sent to ops team
- [ ] **n8n**: Webhooks receiving and processing data
- [ ] **GitHub**: Issues created for production failures

### Environments
- [ ] **Development**: Docker services running locally
- [ ] **Staging**: Auto-deployment from develop branch working
- [ ] **Production**: Manual approval process functional

## 🚨 Common Issues & Quick Fixes

### Pipeline Fails Immediately
```bash
# Check secrets configuration
gh secret list

# Verify environment variables
grep -E "^[A-Z_]+=.*" .env.development

# Check Docker services
docker-compose -f docker-compose.dev.yml ps
```

### Tests Failing
```bash
# Run tests locally to debug
cd backend && npm test
cd ../frontend && npm test

# Check test database
npx prisma studio --browser=none
```

### Deployment Issues
```bash
# Check staging deployment
curl -f https://your-staging-url.com/health

# View deployment logs
gh run view --log
```

### n8n Notifications Not Working
```bash
# Test webhook endpoint
curl -X POST $N8N_WEBHOOK_URL/test-notification \
  -H "Content-Type: application/json" \
  -d '{"type": "test", "message": "manual test"}'

# Check n8n workflow status
# Visit your n8n instance and verify workflows are active
```

## 🎯 Next Steps

Once the basic setup is complete:

1. **Configure Branch Protection**:
   ```bash
   # Set up branch protection rules via GitHub web interface
   # Repository Settings > Branches > Add rule for main/develop
   ```

2. **Deploy n8n Workflows**:
   ```bash
   # Deploy automation workflows
   ./scripts/n8n/claude-n8n-auto-deploy.sh devops-notifications
   ```

3. **Set Up Monitoring**:
   - Configure Slack channels for notifications
   - Set up email distribution lists
   - Test emergency escalation procedures

4. **Team Onboarding**:
   - Share access to monitoring dashboards
   - Review PR template and review process
   - Schedule CI/CD training session

## 📚 Additional Resources

- [Pipeline Architecture](./pipeline-architecture.md) - Detailed technical design
- [Deployment Guide](./deployment-guide.md) - Production deployment procedures
- [Troubleshooting](./troubleshooting.md) - Common issues and solutions
- [Secrets Management](./secrets-management.md) - Security best practices

## 🆘 Getting Help

If you encounter issues during setup:

1. **Check Logs**: Review GitHub Actions workflow logs for error details
2. **Validate Config**: Ensure all environment variables and secrets are set
3. **Test Locally**: Verify the application works in local development
4. **Create Issue**: Use GitHub issues with `ci-cd` and `help-wanted` labels
5. **Emergency**: Contact DevOps team via Slack #critical-alerts

---

**Setup Time**: ~15 minutes  
**Difficulty**: Beginner  
**Prerequisites**: GitHub access, AWS account, basic Docker knowledge