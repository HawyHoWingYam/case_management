#!/bin/bash

# Case Management System - Secrets Management Setup Script
# This script helps configure GitHub Secrets and environment variables for CI/CD

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SECRETS_FILE="$PROJECT_ROOT/.github/secrets.yml"

echo -e "${BLUE}🔐 Case Management System - Secrets Management Setup${NC}"
echo "=================================================="

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to generate secure random passwords
generate_password() {
    local length=${1:-32}
    openssl rand -base64 $length | tr -d "=+/" | cut -c1-$length
}

# Function to generate JWT secret
generate_jwt_secret() {
    openssl rand -base64 64 | tr -d "=+/" | cut -c1-64
}

# Check if GitHub CLI is installed
check_gh_cli() {
    if ! command -v gh &> /dev/null; then
        print_error "GitHub CLI (gh) is not installed."
        print_info "Please install it from: https://cli.github.com/"
        print_info "After installation, run: gh auth login"
        exit 1
    fi
    
    if ! gh auth status &> /dev/null; then
        print_error "GitHub CLI is not authenticated."
        print_info "Please run: gh auth login"
        exit 1
    fi
    
    print_success "GitHub CLI is installed and authenticated"
}

# Function to set GitHub secret
set_github_secret() {
    local secret_name="$1"
    local secret_value="$2"
    local environment="${3:-}"
    
    if [ -n "$environment" ]; then
        gh secret set "$secret_name" --body "$secret_value" --env "$environment"
        print_success "Set secret $secret_name for environment $environment"
    else
        gh secret set "$secret_name" --body "$secret_value"
        print_success "Set repository secret $secret_name"
    fi
}

# Function to prompt for secret value
prompt_for_secret() {
    local secret_name="$1"
    local description="$2"
    local default_value="${3:-}"
    local is_password="${4:-false}"
    
    echo ""
    print_info "$description"
    
    if [ "$is_password" = "true" ]; then
        read -s -p "Enter value for $secret_name (or press Enter to auto-generate): " secret_value
        echo ""
        if [ -z "$secret_value" ]; then
            secret_value=$(generate_password)
            print_info "Auto-generated secure password for $secret_name"
        fi
    else
        read -p "Enter value for $secret_name${default_value:+ (default: $default_value)}: " secret_value
        if [ -z "$secret_value" ] && [ -n "$default_value" ]; then
            secret_value="$default_value"
        fi
    fi
    
    echo "$secret_value"
}

# Main setup function
setup_secrets() {
    print_info "Setting up GitHub Secrets for CI/CD..."
    
    # Repository secrets
    echo ""
    print_info "=== REPOSITORY SECRETS ==="
    
    # Database secrets
    DB_PASSWORD=$(prompt_for_secret "DB_PASSWORD" "PostgreSQL database password for staging/production" "" "true")
    set_github_secret "DB_PASSWORD" "$DB_PASSWORD"
    
    POSTGRES_PASSWORD=$(prompt_for_secret "POSTGRES_PASSWORD" "PostgreSQL admin password" "" "true")
    set_github_secret "POSTGRES_PASSWORD" "$POSTGRES_PASSWORD"
    
    # JWT secrets
    JWT_SECRET=$(generate_jwt_secret)
    set_github_secret "JWT_SECRET" "$JWT_SECRET"
    print_success "Generated and set JWT_SECRET"
    
    # Redis password
    REDIS_PASSWORD=$(prompt_for_secret "REDIS_PASSWORD" "Redis password" "" "true")
    set_github_secret "REDIS_PASSWORD" "$REDIS_PASSWORD"
    
    # AWS S3 configuration
    AWS_ACCESS_KEY_ID=$(prompt_for_secret "AWS_ACCESS_KEY_ID" "AWS Access Key ID for S3 storage")
    set_github_secret "AWS_ACCESS_KEY_ID" "$AWS_ACCESS_KEY_ID"
    
    AWS_SECRET_ACCESS_KEY=$(prompt_for_secret "AWS_SECRET_ACCESS_KEY" "AWS Secret Access Key for S3 storage" "" "true")
    set_github_secret "AWS_SECRET_ACCESS_KEY" "$AWS_SECRET_ACCESS_KEY"
    
    S3_BUCKET_NAME=$(prompt_for_secret "S3_BUCKET_NAME" "S3 bucket name for file storage" "case-management-documents")
    set_github_secret "S3_BUCKET_NAME" "$S3_BUCKET_NAME"
    
    # SendGrid email configuration
    SENDGRID_API_KEY=$(prompt_for_secret "SENDGRID_API_KEY" "SendGrid API key for email notifications" "" "true")
    set_github_secret "SENDGRID_API_KEY" "$SENDGRID_API_KEY"
    
    SENDGRID_FROM_EMAIL=$(prompt_for_secret "SENDGRID_FROM_EMAIL" "SendGrid from email address" "noreply@yourdomain.com")
    set_github_secret "SENDGRID_FROM_EMAIL" "$SENDGRID_FROM_EMAIL"
    
    # n8n webhook configuration
    N8N_WEBHOOK_URL=$(prompt_for_secret "N8N_WEBHOOK_URL" "n8n webhook URL for automation" "https://n8n.yourdomain.com/webhook")
    set_github_secret "N8N_WEBHOOK_URL" "$N8N_WEBHOOK_URL"
    
    WEBHOOK_SECRET=$(prompt_for_secret "WEBHOOK_SECRET" "Webhook authentication secret" "" "true")
    set_github_secret "WEBHOOK_SECRET" "$WEBHOOK_SECRET"
    
    # Monitoring and observability
    SENTRY_DSN=$(prompt_for_secret "SENTRY_DSN" "Sentry DNS for error tracking (optional)")
    if [ -n "$SENTRY_DSN" ]; then
        set_github_secret "SENTRY_DSN" "$SENTRY_DSN"
        set_github_secret "NEXT_PUBLIC_SENTRY_DSN" "$SENTRY_DSN"
    fi
    
    # Security scanning
    SNYK_TOKEN=$(prompt_for_secret "SNYK_TOKEN" "Snyk token for vulnerability scanning (optional)")
    if [ -n "$SNYK_TOKEN" ]; then
        set_github_secret "SNYK_TOKEN" "$SNYK_TOKEN"
    fi
    
    # Lighthouse CI
    LHCI_GITHUB_APP_TOKEN=$(prompt_for_secret "LHCI_GITHUB_APP_TOKEN" "Lighthouse CI GitHub App token (optional)")
    if [ -n "$LHCI_GITHUB_APP_TOKEN" ]; then
        set_github_secret "LHCI_GITHUB_APP_TOKEN" "$LHCI_GITHUB_APP_TOKEN"
    fi
    
    # Environment-specific secrets
    echo ""
    print_info "=== STAGING ENVIRONMENT SECRETS ==="
    
    STAGING_DATABASE_URL=$(prompt_for_secret "STAGING_DATABASE_URL" "Staging database URL")
    set_github_secret "DATABASE_URL" "$STAGING_DATABASE_URL" "staging"
    
    STAGING_REDIS_URL=$(prompt_for_secret "STAGING_REDIS_URL" "Staging Redis URL" "redis://localhost:6379")
    set_github_secret "REDIS_URL" "$STAGING_REDIS_URL" "staging"
    
    STAGING_BACKEND_URL=$(prompt_for_secret "STAGING_BACKEND_URL" "Staging backend URL" "https://api-staging.yourdomain.com")
    set_github_secret "STAGING_BACKEND_URL" "$STAGING_BACKEND_URL"
    
    STAGING_FRONTEND_URL=$(prompt_for_secret "STAGING_FRONTEND_URL" "Staging frontend URL" "https://staging.yourdomain.com")
    set_github_secret "STAGING_FRONTEND_URL" "$STAGING_FRONTEND_URL"
    
    echo ""
    print_info "=== PRODUCTION ENVIRONMENT SECRETS ==="
    
    PRODUCTION_DATABASE_URL=$(prompt_for_secret "PRODUCTION_DATABASE_URL" "Production database URL")
    set_github_secret "DATABASE_URL" "$PRODUCTION_DATABASE_URL" "production"
    
    PRODUCTION_REDIS_URL=$(prompt_for_secret "PRODUCTION_REDIS_URL" "Production Redis URL")
    set_github_secret "REDIS_URL" "$PRODUCTION_REDIS_URL" "production"
    
    PRODUCTION_BACKEND_URL=$(prompt_for_secret "PRODUCTION_BACKEND_URL" "Production backend URL" "https://api.yourdomain.com")
    set_github_secret "PRODUCTION_BACKEND_URL" "$PRODUCTION_BACKEND_URL"
    
    PRODUCTION_FRONTEND_URL=$(prompt_for_secret "PRODUCTION_FRONTEND_URL" "Production frontend URL" "https://yourdomain.com")
    set_github_secret "PRODUCTION_FRONTEND_URL" "$PRODUCTION_FRONTEND_URL"
    
    # Production-specific secrets
    DOMAIN_NAME=$(prompt_for_secret "DOMAIN_NAME" "Production domain name" "yourdomain.com")
    set_github_secret "DOMAIN_NAME" "$DOMAIN_NAME" "production"
    
    ACME_EMAIL=$(prompt_for_secret "ACME_EMAIL" "Email for SSL certificate registration" "admin@yourdomain.com")
    set_github_secret "ACME_EMAIL" "$ACME_EMAIL" "production"
    
    GRAFANA_ADMIN_PASSWORD=$(prompt_for_secret "GRAFANA_ADMIN_PASSWORD" "Grafana admin password" "" "true")
    set_github_secret "GRAFANA_ADMIN_PASSWORD" "$GRAFANA_ADMIN_PASSWORD" "production"
    
    GRAFANA_SECRET_KEY=$(generate_password 32)
    set_github_secret "GRAFANA_SECRET_KEY" "$GRAFANA_SECRET_KEY" "production"
}

# Function to create secrets documentation
create_secrets_docs() {
    print_info "Creating secrets documentation..."
    
cat > "$SECRETS_FILE" << EOF
# GitHub Secrets Configuration
# This file documents the required secrets for the Case Management System CI/CD pipeline
# DO NOT store actual secret values in this file

## Repository Secrets
# These secrets are available to all workflows and environments

### Database Configuration
- DB_PASSWORD: PostgreSQL database password
- POSTGRES_PASSWORD: PostgreSQL admin password
- REDIS_PASSWORD: Redis authentication password

### Authentication
- JWT_SECRET: JSON Web Token signing secret (64 characters minimum)
- WEBHOOK_SECRET: Webhook authentication secret

### AWS S3 Storage
- AWS_ACCESS_KEY_ID: AWS access key for S3 operations
- AWS_SECRET_ACCESS_KEY: AWS secret key for S3 operations
- S3_BUCKET_NAME: S3 bucket name for file storage

### Email Configuration
- SENDGRID_API_KEY: SendGrid API key for email notifications
- SENDGRID_FROM_EMAIL: From email address for notifications

### n8n Automation
- N8N_WEBHOOK_URL: n8n webhook endpoint for automation workflows

### Monitoring & Security
- SENTRY_DSN: Sentry error tracking DSN (optional)
- NEXT_PUBLIC_SENTRY_DSN: Public Sentry DSN for frontend
- SNYK_TOKEN: Snyk security scanning token (optional)
- LHCI_GITHUB_APP_TOKEN: Lighthouse CI GitHub App token (optional)

## Environment-Specific Secrets

### Staging Environment
- DATABASE_URL: Staging database connection string
- REDIS_URL: Staging Redis connection string
- STAGING_BACKEND_URL: Staging backend URL for testing
- STAGING_FRONTEND_URL: Staging frontend URL for testing

### Production Environment
- DATABASE_URL: Production database connection string
- REDIS_URL: Production Redis connection string
- PRODUCTION_BACKEND_URL: Production backend URL
- PRODUCTION_FRONTEND_URL: Production frontend URL
- DOMAIN_NAME: Production domain name
- ACME_EMAIL: Email for SSL certificate registration
- GRAFANA_ADMIN_PASSWORD: Grafana admin password
- GRAFANA_SECRET_KEY: Grafana secret key

## Setup Instructions
1. Run this script: ./scripts/setup-secrets.sh
2. Follow the prompts to enter secret values
3. Verify secrets in GitHub repository settings
4. Update environment-specific values as needed

## Security Notes
- All secrets are encrypted at rest in GitHub
- Use strong, unique passwords for all services
- Rotate secrets regularly (every 90 days recommended)
- Never commit actual secret values to the repository
- Use environment-specific secrets for isolation
EOF

    print_success "Created secrets documentation at $SECRETS_FILE"
}

# Function to validate secrets
validate_secrets() {
    print_info "Validating GitHub Secrets..."
    
    # List of required secrets
    required_secrets=(
        "DB_PASSWORD"
        "JWT_SECRET"
        "AWS_ACCESS_KEY_ID"
        "AWS_SECRET_ACCESS_KEY"
        "SENDGRID_API_KEY"
        "N8N_WEBHOOK_URL"
    )
    
    missing_secrets=()
    
    for secret in "${required_secrets[@]}"; do
        if ! gh secret list | grep -q "^$secret"; then
            missing_secrets+=("$secret")
        fi
    done
    
    if [ ${#missing_secrets[@]} -eq 0 ]; then
        print_success "All required secrets are configured"
    else
        print_warning "Missing required secrets:"
        for secret in "${missing_secrets[@]}"; do
            echo "  - $secret"
        done
    fi
}

# Main execution
main() {
    case "${1:-setup}" in
        "setup")
            check_gh_cli
            setup_secrets
            create_secrets_docs
            validate_secrets
            echo ""
            print_success "Secrets setup completed successfully!"
            print_info "Next steps:"
            echo "  1. Verify secrets in GitHub repository settings"
            echo "  2. Test CI/CD pipeline with a test commit"
            echo "  3. Monitor deployment workflows"
            ;;
        "validate")
            check_gh_cli
            validate_secrets
            ;;
        "docs")
            create_secrets_docs
            ;;
        *)
            echo "Usage: $0 [setup|validate|docs]"
            echo ""
            echo "Commands:"
            echo "  setup    - Set up all GitHub secrets (default)"
            echo "  validate - Validate existing secrets"
            echo "  docs     - Create secrets documentation"
            exit 1
            ;;
    esac
}

# Execute main function with all arguments
main "$@"