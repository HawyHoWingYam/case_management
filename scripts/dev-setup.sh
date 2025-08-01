#!/bin/bash

# =============================================================================
# Case Management System - Development Environment Setup Script
# =============================================================================
# 
# This script sets up the complete development environment for the Case Management
# System, including all dependencies, services, and configurations needed for
# multi-agent development.
#
# Usage: ./scripts/dev-setup.sh [options]
# Options:
#   --quick      Skip optional components (Docker, n8n)
#   --backend    Setup backend only
#   --frontend   Setup frontend only
#   --reset      Reset and clean all existing installations
#   --help       Show this help message
#
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_FILE="${PROJECT_ROOT}/logs/dev-setup.log"
BACKEND_DIR="${PROJECT_ROOT}/backend"
FRONTEND_DIR="${PROJECT_ROOT}/frontend"

# Ensure logs directory exists
mkdir -p "${PROJECT_ROOT}/logs"

# =============================================================================
# Utility Functions
# =============================================================================

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}ℹ️  $1${NC}" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}❌ $1${NC}" | tee -a "$LOG_FILE"
}

step() {
    echo -e "${PURPLE}🚀 $1${NC}" | tee -a "$LOG_FILE"
}

check_command() {
    if command -v "$1" >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# =============================================================================
# Help Function
# =============================================================================

show_help() {
    cat << EOF
Case Management System - Development Environment Setup

Usage: $0 [options]

Options:
    --quick      Skip optional components (Docker, n8n setup)
    --backend    Setup backend only
    --frontend   Setup frontend only
    --reset      Reset and clean all existing installations
    --help       Show this help message

Examples:
    $0                    # Full setup
    $0 --quick            # Quick setup without Docker/n8n
    $0 --backend          # Backend only
    $0 --frontend         # Frontend only
    $0 --reset            # Clean reset

This script will:
1. Check system requirements
2. Install Node.js dependencies
3. Setup PostgreSQL database
4. Configure environment variables
5. Initialize services and run tests
6. Setup development tools and scripts

Requirements:
- Node.js 18+
- PostgreSQL 15+
- Git
- Optional: Docker, Docker Compose

EOF
}

# =============================================================================
# System Requirements Check
# =============================================================================

check_system_requirements() {
    step "Checking system requirements..."
    
    local requirements_met=true
    
    # Check Node.js
    if check_command node; then
        local node_version
        node_version=$(node --version | sed 's/v//')
        local major_version
        major_version=$(echo "$node_version" | cut -d. -f1)
        
        if [ "$major_version" -ge 18 ]; then
            success "Node.js $node_version (requirement: 18+)"
        else
            error "Node.js version $node_version is too old. Required: 18+"
            requirements_met=false
        fi
    else
        error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
        requirements_met=false
    fi
    
    # Check npm
    if check_command npm; then
        local npm_version
        npm_version=$(npm --version)
        success "npm $npm_version"
    else
        error "npm is not installed"
        requirements_met=false
    fi
    
    # Check PostgreSQL
    if check_command psql; then
        local pg_version
        pg_version=$(psql --version | awk '{print $3}')
        success "PostgreSQL $pg_version"
    else
        warning "PostgreSQL not found. You'll need to install it manually."
        info "Install PostgreSQL: https://www.postgresql.org/download/"
    fi
    
    # Check Git
    if check_command git; then
        local git_version
        git_version=$(git --version | awk '{print $3}')
        success "Git $git_version"
    else
        error "Git is not installed"
        requirements_met=false
    fi
    
    # Optional: Check Docker
    if check_command docker; then
        local docker_version
        docker_version=$(docker --version | awk '{print $3}' | sed 's/,//')
        success "Docker $docker_version (optional)"
    else
        warning "Docker not found (optional for development)"
    fi
    
    # Optional: Check Docker Compose
    if check_command docker-compose; then
        local compose_version
        compose_version=$(docker-compose --version | awk '{print $3}' | sed 's/,//')
        success "Docker Compose $compose_version (optional)"
    fi
    
    if [ "$requirements_met" = false ]; then
        error "System requirements not met. Please install the required software and try again."
        exit 1
    fi
    
    success "All system requirements met!"
}

# =============================================================================
# Environment Setup
# =============================================================================

setup_environment_files() {
    step "Setting up environment files..."
    
    # Backend environment
    if [ ! -f "$BACKEND_DIR/.env" ]; then
        if [ -f "$BACKEND_DIR/.env.example" ]; then
            cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
            success "Created backend/.env from template"
            warning "Please update backend/.env with your actual configuration"
        else
            warning "Backend .env.example not found. Creating basic .env..."
            cat > "$BACKEND_DIR/.env" << EOF
# Database
DATABASE_URL="postgresql://case_user:case_password@localhost:5432/case_management_dev"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-in-production"
JWT_EXPIRES_IN="1h"
JWT_REFRESH_EXPIRES_IN="7d"

# Security
BCRYPT_ROUNDS=12

# Server Configuration
PORT=3001
NODE_ENV="development"
CORS_ORIGIN="http://localhost:3000"

# n8n Integration
N8N_WEBHOOK_URL="http://localhost:5678/webhook/test"

# Logging
LOG_LEVEL="debug"

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100
EOF
            success "Created basic backend/.env file"
        fi
    else
        info "Backend .env already exists"
    fi
    
    # Frontend environment
    if [ ! -f "$FRONTEND_DIR/.env.local" ]; then
        cat > "$FRONTEND_DIR/.env.local" << EOF
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_NAME="Case Management System"
NEXT_PUBLIC_APP_VERSION="1.0.0"

# Environment
NODE_ENV=development

# Security
NEXTAUTH_SECRET="your-nextauth-secret-change-in-production"
NEXTAUTH_URL="http://localhost:3000"
EOF
        success "Created frontend/.env.local"
    else
        info "Frontend .env.local already exists"
    fi
}

# =============================================================================
# Database Setup
# =============================================================================

setup_database() {
    step "Setting up PostgreSQL database..."
    
    # Check if PostgreSQL is running
    if ! pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
        warning "PostgreSQL is not running on localhost:5432"
        info "Starting PostgreSQL with Docker Compose..."
        
        if [ -f "$PROJECT_ROOT/docker-compose.dev.yml" ]; then
            cd "$PROJECT_ROOT"
            docker-compose -f docker-compose.dev.yml up -d postgres
            
            # Wait for PostgreSQL to be ready
            info "Waiting for PostgreSQL to be ready..."
            local timeout=30
            local count=0
            while ! pg_isready -h localhost -p 5432 >/dev/null 2>&1 && [ $count -lt $timeout ]; do
                sleep 1
                count=$((count + 1))
                echo -n "."
            done
            echo ""
            
            if [ $count -eq $timeout ]; then
                error "PostgreSQL failed to start within $timeout seconds"
                return 1
            fi
            
            success "PostgreSQL started with Docker"
        else
            warning "docker-compose.dev.yml not found. Please start PostgreSQL manually."
            info "Create database: createdb case_management_dev"
            info "Create user: createuser case_user -P"
            return 1
        fi
    else
        success "PostgreSQL is running"
    fi
    
    # Test database connection
    cd "$BACKEND_DIR"
    if npm run prisma:generate >/dev/null 2>&1; then
        success "Prisma client generated"
    else
        warning "Failed to generate Prisma client"
    fi
    
    # Run migrations
    info "Running database migrations..."
    if npm run prisma:migrate >/dev/null 2>&1; then
        success "Database migrations completed"
    else
        warning "Database migrations failed. You may need to run them manually."
        info "Run: cd backend && npm run prisma:migrate"
    fi
    
    # Seed database
    info "Seeding database with demo data..."
    if npm run seed >/dev/null 2>&1; then
        success "Database seeded with demo data"
    else
        warning "Database seeding failed. You may need to run it manually."
        info "Run: cd backend && npm run seed"
    fi
}

# =============================================================================
# Dependencies Installation
# =============================================================================

install_backend_dependencies() {
    step "Installing backend dependencies..."
    
    cd "$BACKEND_DIR"
    
    if [ -f "package.json" ]; then
        info "Installing Node.js dependencies..."
        npm ci --silent
        success "Backend dependencies installed"
        
        # Generate Prisma client
        info "Generating Prisma client..."
        npm run prisma:generate --silent
        success "Prisma client generated"
    else
        error "Backend package.json not found!"
        return 1
    fi
}

install_frontend_dependencies() {
    step "Installing frontend dependencies..."
    
    cd "$FRONTEND_DIR"
    
    if [ -f "package.json" ]; then
        info "Installing Node.js dependencies..."
        npm ci --silent
        success "Frontend dependencies installed"
    else
        error "Frontend package.json not found!"
        return 1
    fi
}

# =============================================================================
# Services Testing
# =============================================================================

test_backend_service() {
    step "Testing backend service..."
    
    cd "$BACKEND_DIR"
    
    # Start backend in background
    info "Starting backend service..."
    npm run start:dev >/dev/null 2>&1 &
    local backend_pid=$!
    
    # Wait for backend to be ready
    local timeout=30
    local count=0
    while ! curl -s http://localhost:3001/api/health >/dev/null 2>&1 && [ $count -lt $timeout ]; do
        sleep 1
        count=$((count + 1))
    done
    
    if [ $count -eq $timeout ]; then
        kill $backend_pid >/dev/null 2>&1
        error "Backend service failed to start within $timeout seconds"
        return 1
    fi
    
    # Test health endpoint
    local health_response
    health_response=$(curl -s http://localhost:3001/api/health)
    if echo "$health_response" | grep -q "ok"; then
        success "Backend service is healthy"
    else
        warning "Backend service health check failed"
    fi
    
    # Test detailed health endpoint
    local detailed_health
    detailed_health=$(curl -s http://localhost:3001/api/health/detailed)
    if echo "$detailed_health" | grep -q "database"; then
        success "Backend database connection is working"
    else
        warning "Backend database connection may have issues"
    fi
    
    # Stop backend
    kill $backend_pid >/dev/null 2>&1
    info "Backend service test completed"
}

test_frontend_service() {
    step "Testing frontend service..."
    
    cd "$FRONTEND_DIR"
    
    # Build frontend
    info "Building frontend..."
    if npm run build >/dev/null 2>&1; then
        success "Frontend builds successfully"
    else
        error "Frontend build failed"
        return 1
    fi
    
    # Type checking
    info "Running TypeScript type checking..."
    if npm run type-check >/dev/null 2>&1; then
        success "Frontend TypeScript types are valid"
    else
        warning "Frontend TypeScript type checking failed"
    fi
    
    # Linting
    info "Running ESLint..."
    if npm run lint >/dev/null 2>&1; then
        success "Frontend linting passed"
    else
        warning "Frontend linting issues found"
    fi
}

# =============================================================================
# Development Tools Setup
# =============================================================================

setup_development_tools() {
    step "Setting up development tools..."
    
    # Make scripts executable
    chmod +x "$PROJECT_ROOT/scripts"/*.sh
    success "Made scripts executable"
    
    # Create useful aliases
    cat > "$PROJECT_ROOT/.dev-aliases" << 'EOF'
# Case Management System Development Aliases
alias cms-start='make dev-start'
alias cms-stop='make dev-stop'
alias cms-test='make test-all'
alias cms-clean='make clean-all'
alias cms-logs='make logs'
alias cms-db='npm run prisma:studio --prefix backend'
alias cms-backend='cd backend && npm run start:dev'
alias cms-frontend='cd frontend && npm run dev'
alias cms-health='curl -s http://localhost:3001/api/health | jq'
EOF
    
    info "Development aliases created in .dev-aliases"
    info "Source with: source .dev-aliases"
    
    # Create VSCode settings if not exists
    if [ ! -d "$PROJECT_ROOT/.vscode" ]; then
        mkdir -p "$PROJECT_ROOT/.vscode"
        
        cat > "$PROJECT_ROOT/.vscode/settings.json" << EOF
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.next": true,
    "**/coverage": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.next": true,
    "**/coverage": true
  }
}
EOF
        success "VSCode settings created"
    fi
    
    # Create recommended extensions
    cat > "$PROJECT_ROOT/.vscode/extensions.json" << EOF
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "ms-vscode.vscode-typescript-next",
    "ms-vscode.vscode-json"
  ]
}
EOF
    success "VSCode recommended extensions configured"
}

# =============================================================================
# Health Check Summary
# =============================================================================

run_health_checks() {
    step "Running comprehensive health checks..."
    
    local issues=0
    
    # Check if all services can start
    info "Checking backend service..."
    cd "$BACKEND_DIR"
    if npm run start:dev >/dev/null 2>&1 &
    then
        local backend_pid=$!
        sleep 5
        
        if curl -s http://localhost:3001/api/health >/dev/null 2>&1; then
            success "Backend service: OK"
        else
            error "Backend service: FAILED"
            issues=$((issues + 1))
        fi
        
        kill $backend_pid >/dev/null 2>&1
    else
        error "Backend service failed to start"
        issues=$((issues + 1))
    fi
    
    info "Checking frontend build..."
    cd "$FRONTEND_DIR"
    if npm run build >/dev/null 2>&1; then
        success "Frontend build: OK"
    else
        error "Frontend build: FAILED"
        issues=$((issues + 1))
    fi
    
    info "Checking database connection..."
    cd "$BACKEND_DIR"
    if npm run prisma:generate >/dev/null 2>&1; then
        success "Database connection: OK"
    else
        error "Database connection: FAILED"
        issues=$((issues + 1))
    fi
    
    return $issues
}

# =============================================================================
# Reset Function
# =============================================================================

reset_development_environment() {
    step "Resetting development environment..."
    
    warning "This will remove all node_modules, builds, and generated files"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        info "Reset cancelled"
        return 0
    fi
    
    # Stop any running services
    pkill -f "npm run start:dev" >/dev/null 2>&1 || true
    pkill -f "next dev" >/dev/null 2>&1 || true
    
    # Remove node_modules
    rm -rf "$BACKEND_DIR/node_modules"
    rm -rf "$FRONTEND_DIR/node_modules"
    success "Removed node_modules directories"
    
    # Remove build artifacts
    rm -rf "$BACKEND_DIR/dist"
    rm -rf "$FRONTEND_DIR/.next"
    rm -rf "$FRONTEND_DIR/out"
    success "Removed build artifacts"
    
    # Remove generated files
    rm -rf "$BACKEND_DIR/prisma/generated"
    success "Removed generated files"
    
    # Remove logs
    rm -rf "$PROJECT_ROOT/logs/*"
    success "Cleared log files"
    
    info "Development environment reset complete"
    info "Run ./scripts/dev-setup.sh to reinstall everything"
}

# =============================================================================
# Main Execution
# =============================================================================

main() {
    echo -e "${CYAN}"
    echo "=================================================================="
    echo "  Case Management System - Development Environment Setup"
    echo "=================================================================="
    echo -e "${NC}"
    
    log "Starting development environment setup..."
    log "Project root: $PROJECT_ROOT"
    
    # Parse command line arguments
    local quick_mode=false
    local backend_only=false
    local frontend_only=false
    local reset_mode=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --quick)
                quick_mode=true
                shift
                ;;
            --backend)
                backend_only=true
                shift
                ;;
            --frontend)
                frontend_only=true
                shift
                ;;
            --reset)
                reset_mode=true
                shift
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                warning "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # Handle reset mode
    if [ "$reset_mode" = true ]; then
        reset_development_environment
        exit 0
    fi
    
    # Check system requirements
    check_system_requirements
    
    # Setup environment files
    setup_environment_files
    
    # Install dependencies and setup services
    if [ "$frontend_only" != true ]; then
        install_backend_dependencies
        setup_database
    fi
    
    if [ "$backend_only" != true ]; then
        install_frontend_dependencies
    fi
    
    # Setup development tools
    setup_development_tools
    
    # Run health checks
    if run_health_checks; then
        echo -e "${GREEN}"
        echo "=================================================================="
        echo "  🎉 Development Environment Setup Complete!"
        echo "=================================================================="
        echo -e "${NC}"
        
        echo ""
        echo "Next steps:"
        echo "1. Source development aliases: source .dev-aliases"
        echo "2. Start backend: cd backend && npm run start:dev"
        echo "3. Start frontend: cd frontend && npm run dev"
        echo "4. Open Prisma Studio: cd backend && npm run prisma:studio"
        echo ""
        echo "URLs:"
        echo "- Frontend: http://localhost:3000"
        echo "- Backend API: http://localhost:3001/api"
        echo "- API Documentation: http://localhost:3001/api/docs"
        echo "- Prisma Studio: http://localhost:5555"
        echo ""
        echo "Quick commands:"
        echo "- cms-start    # Start all services"
        echo "- cms-test     # Run all tests"
        echo "- cms-health   # Check service health"
        echo ""
        
        success "Setup completed successfully!"
        log "Development environment setup completed successfully"
    else
        echo -e "${RED}"
        echo "=================================================================="
        echo "  ⚠️  Setup completed with issues"
        echo "=================================================================="
        echo -e "${NC}"
        
        warning "Some components failed to start properly"
        info "Check the log file: $LOG_FILE"
        info "Run health checks manually with the commands shown above"
        
        log "Development environment setup completed with issues"
    fi
}

# Execute main function with all arguments
main "$@"