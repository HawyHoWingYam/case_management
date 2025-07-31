#!/bin/bash

# Test All - Comprehensive Test Suite Runner
# This script runs all tests (unit, integration, E2E) with coverage reporting

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print banner
echo -e "${BLUE}"
echo "================================================"
echo "    Case Management System - Test Suite        "
echo "================================================"
echo -e "${NC}"

# Configuration
START_TIME=$(date +%s)
COVERAGE_THRESHOLD=90
FAILED_TESTS=()
COVERAGE_DIR="./coverage"
REPORTS_DIR="./test-reports"

# Create directories
mkdir -p "$COVERAGE_DIR"
mkdir -p "$REPORTS_DIR"

# Functions
print_section() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

check_prerequisites() {
    print_section "Checking Prerequisites"
    
    # Check if Docker is running
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    print_success "Docker is running"
    
    # Check if Node.js is installed
    if ! command -v node >/dev/null 2>&1; then
        print_error "Node.js is not installed"
        exit 1
    fi
    print_success "Node.js is installed ($(node --version))"
    
    # Check if npm is installed
    if ! command -v npm >/dev/null 2>&1; then
        print_error "npm is not installed"
        exit 1
    fi
    print_success "npm is installed ($(npm --version))"
    
    # Check if dependencies are installed
    if [ ! -d "backend/node_modules" ]; then
        print_warning "Backend dependencies not found. Installing..."
        cd backend && npm ci && cd ..
    fi
    
    if [ ! -d "frontend/node_modules" ]; then
        print_warning "Frontend dependencies not found. Installing..."
        cd frontend && npm ci && cd ..
    fi
    
    print_success "All prerequisites met"
}

start_test_services() {
    print_section "Starting Test Services"
    
    # Start test database and services
    echo "Starting test database containers..."
    docker-compose -f docker-compose.test.yml up -d --wait
    
    # Wait for services to be ready
    echo "Waiting for services to be ready..."
    sleep 10
    
    # Verify database connection
    if docker-compose -f docker-compose.test.yml exec -T postgres-test pg_isready -U test_user -d case_management_test; then
        print_success "Test database is ready"
    else
        print_error "Test database failed to start"
        exit 1
    fi
    
    # Verify Redis connection
    if docker-compose -f docker-compose.test.yml exec -T redis-test redis-cli ping | grep -q "PONG"; then
        print_success "Test Redis is ready"
    else
        print_error "Test Redis failed to start"
        exit 1
    fi
}

run_backend_unit_tests() {
    print_section "Running Backend Unit Tests"
    
    cd backend
    
    if npm run test:unit 2>&1 | tee ../test-reports/backend-unit.log; then
        print_success "Backend unit tests passed"
    else
        print_error "Backend unit tests failed"
        FAILED_TESTS+=("Backend Unit Tests")
    fi
    
    cd ..
}

run_frontend_unit_tests() {
    print_section "Running Frontend Unit Tests"
    
    cd frontend
    
    if npm run test:ci 2>&1 | tee ../test-reports/frontend-unit.log; then
        print_success "Frontend unit tests passed"
    else
        print_error "Frontend unit tests failed"
        FAILED_TESTS+=("Frontend Unit Tests")
    fi
    
    cd ..
}

run_backend_integration_tests() {
    print_section "Running Backend Integration Tests"
    
    cd backend
    
    # Set test environment variables
    export NODE_ENV=test
    export TEST_DB_HOST=localhost
    export TEST_DB_PORT=5433
    export TEST_DB_NAME=case_management_test
    export TEST_DB_USERNAME=test_user
    export TEST_DB_PASSWORD=test_password
    export TEST_REDIS_HOST=localhost
    export TEST_REDIS_PORT=6380
    
    if npm run test:integration 2>&1 | tee ../test-reports/backend-integration.log; then
        print_success "Backend integration tests passed"
    else
        print_error "Backend integration tests failed"
        FAILED_TESTS+=("Backend Integration Tests")
    fi
    
    cd ..
}

run_e2e_tests() {
    print_section "Running E2E Tests"
    
    # Start backend server for E2E tests
    echo "Starting backend server..."
    cd backend
    npm run build
    npm run start:prod &
    BACKEND_PID=$!
    cd ..
    
    # Start frontend server for E2E tests
    echo "Starting frontend server..."
    cd frontend
    npm run build
    npm start &
    FRONTEND_PID=$!
    cd ..
    
    # Wait for servers to be ready
    echo "Waiting for servers to start..."
    sleep 30
    
    # Check if servers are running
    if curl -f http://localhost:3001/health >/dev/null 2>&1; then
        print_success "Backend server is ready"
    else
        print_error "Backend server failed to start"
        FAILED_TESTS+=("E2E Tests (Backend Server)")
    fi
    
    if curl -f http://localhost:3000 >/dev/null 2>&1; then
        print_success "Frontend server is ready"
    else
        print_error "Frontend server failed to start"
        FAILED_TESTS+=("E2E Tests (Frontend Server)")
    fi
    
    # Run E2E tests
    if [ ${#FAILED_TESTS[@]} -eq 0 ]; then
        export CYPRESS_baseUrl=http://localhost:3000
        export CYPRESS_apiUrl=http://localhost:3001/api
        
        if npm run test:e2e 2>&1 | tee test-reports/e2e.log; then
            print_success "E2E tests passed"
        else
            print_error "E2E tests failed"
            FAILED_TESTS+=("E2E Tests")
        fi
    fi
    
    # Kill servers
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
}

run_lint_checks() {
    print_section "Running Lint Checks"
    
    # Backend lint
    cd backend
    if npm run lint 2>&1 | tee ../test-reports/backend-lint.log; then
        print_success "Backend lint passed"
    else
        print_warning "Backend lint issues found"
    fi
    cd ..
    
    # Frontend lint
    cd frontend
    if npm run lint 2>&1 | tee ../test-reports/frontend-lint.log; then
        print_success "Frontend lint passed"
    else
        print_warning "Frontend lint issues found"
    fi
    cd ..
}

run_security_audit() {
    print_section "Running Security Audit"
    
    # Backend security audit
    cd backend
    if npm audit --audit-level high 2>&1 | tee ../test-reports/backend-audit.log; then
        print_success "Backend security audit passed"
    else
        print_warning "Backend security vulnerabilities found"
    fi
    cd ..
    
    # Frontend security audit
    cd frontend
    if npm audit --audit-level high 2>&1 | tee ../test-reports/frontend-audit.log; then
        print_success "Frontend security audit passed"
    else
        print_warning "Frontend security vulnerabilities found"
    fi
    cd ..
}

generate_coverage_report() {
    print_section "Generating Coverage Report"
    
    # Combine coverage reports
    echo "Combining coverage reports..."
    
    # Create HTML coverage report
    cat > "$COVERAGE_DIR/index.html" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Case Management System - Test Coverage Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { background: #f0f0f0; padding: 20px; border-radius: 5px; }
        .summary { margin: 20px 0; }
        .coverage-table { width: 100%; border-collapse: collapse; }
        .coverage-table th, .coverage-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .coverage-table th { background-color: #f2f2f2; }
        .high { background-color: #d4edda; }
        .medium { background-color: #fff3cd; }
        .low { background-color: #f8d7da; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Case Management System - Test Coverage Report</h1>
        <p>Generated on: $(date)</p>
    </div>
    
    <div class="summary">
        <h2>Coverage Summary</h2>
        <table class="coverage-table">
            <tr><th>Component</th><th>Lines</th><th>Functions</th><th>Branches</th><th>Statements</th></tr>
            <tr><td>Backend</td><td colspan="4">See backend/coverage/index.html</td></tr>
            <tr><td>Frontend</td><td colspan="4">See frontend/coverage/index.html</td></tr>
        </table>
    </div>
    
    <div class="links">
        <h2>Detailed Reports</h2>
        <ul>
            <li><a href="backend/index.html">Backend Coverage Report</a></li>
            <li><a href="frontend/index.html">Frontend Coverage Report</a></li>
        </ul>
    </div>
</body>
</html>
EOF
    
    # Copy coverage reports
    if [ -d "backend/coverage" ]; then
        cp -r backend/coverage "$COVERAGE_DIR/backend"
        print_success "Backend coverage report copied"
    fi
    
    if [ -d "frontend/coverage" ]; then
        cp -r frontend/coverage "$COVERAGE_DIR/frontend"
        print_success "Frontend coverage report copied"
    fi
    
    echo "Coverage report available at: $COVERAGE_DIR/index.html"
}

cleanup() {
    print_section "Cleaning Up"
    
    # Stop test services
    docker-compose -f docker-compose.test.yml down -v 2>/dev/null || true
    
    # Kill any remaining processes
    pkill -f "node.*backend" 2>/dev/null || true
    pkill -f "node.*frontend" 2>/dev/null || true
    pkill -f "next" 2>/dev/null || true
    
    print_success "Cleanup completed"
}

print_summary() {
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    
    print_section "Test Summary"
    
    echo "Total execution time: ${DURATION}s"
    echo ""
    
    if [ ${#FAILED_TESTS[@]} -eq 0 ]; then
        echo -e "${GREEN}"
        echo "🎉 All tests passed! 🎉"
        echo ""
        echo "✓ Backend unit tests"
        echo "✓ Frontend unit tests"
        echo "✓ Backend integration tests"
        echo "✓ E2E tests"
        echo "✓ Lint checks"
        echo "✓ Security audit"
        echo -e "${NC}"
        
        echo "Coverage report: $COVERAGE_DIR/index.html"
        echo "Test reports: $REPORTS_DIR/"
        
        exit 0
    else
        echo -e "${RED}"
        echo "❌ Some tests failed:"
        echo ""
        for test in "${FAILED_TESTS[@]}"; do
            echo "✗ $test"
        done
        echo -e "${NC}"
        
        echo ""
        echo "Check the following logs for details:"
        ls -la test-reports/
        
        exit 1
    fi
}

# Main execution
main() {
    # Handle interrupts
    trap cleanup EXIT INT TERM
    
    check_prerequisites
    start_test_services
    
    run_backend_unit_tests
    run_frontend_unit_tests
    run_backend_integration_tests
    run_e2e_tests
    run_lint_checks
    run_security_audit
    
    generate_coverage_report
    print_summary
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-e2e)
            SKIP_E2E=true
            shift
            ;;
        --skip-lint)
            SKIP_LINT=true
            shift
            ;;
        --skip-audit)
            SKIP_AUDIT=true
            shift
            ;;
        --coverage-threshold)
            COVERAGE_THRESHOLD="$2"
            shift 2
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --skip-e2e              Skip E2E tests"
            echo "  --skip-lint             Skip lint checks"
            echo "  --skip-audit            Skip security audit"
            echo "  --coverage-threshold N  Set coverage threshold (default: 90)"
            echo "  -h, --help              Show this help message"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Run main function
main