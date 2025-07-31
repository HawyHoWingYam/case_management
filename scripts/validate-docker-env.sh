#!/bin/bash

# Case Management Docker Environment Validation Script
# This script validates that all Docker services are running correctly

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.dev.yml"
TEST_TIMEOUT=30

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Validation results
validation_results=()
failed_tests=0

# Function to add test result
add_result() {
    local test_name="$1"
    local status="$2"
    local message="$3"
    
    validation_results+=("$test_name|$status|$message")
    
    if [ "$status" = "FAIL" ]; then
        failed_tests=$((failed_tests + 1))
        print_error "$test_name: $message"
    elif [ "$status" = "WARN" ]; then
        print_warning "$test_name: $message"
    else
        print_success "$test_name: $message"
    fi
}

# Function to test Docker availability
test_docker() {
    print_status "Testing Docker availability..."
    
    if ! command -v docker &> /dev/null; then
        add_result "Docker Installation" "FAIL" "Docker command not found"
        return 1
    fi
    
    if ! docker info > /dev/null 2>&1; then
        add_result "Docker Service" "FAIL" "Docker daemon is not running"
        return 1
    fi
    
    add_result "Docker Installation" "PASS" "Docker is installed and running"
    return 0
}

# Function to test Docker Compose availability
test_docker_compose() {
    print_status "Testing Docker Compose availability..."
    
    if ! command -v docker-compose &> /dev/null; then
        add_result "Docker Compose" "FAIL" "docker-compose command not found"
        return 1
    fi
    
    if [ ! -f "$COMPOSE_FILE" ]; then
        add_result "Compose File" "FAIL" "$COMPOSE_FILE not found"
        return 1
    fi
    
    add_result "Docker Compose" "PASS" "docker-compose is available"
    add_result "Compose File" "PASS" "$COMPOSE_FILE exists"
    return 0
}

# Function to test service containers
test_containers() {
    print_status "Testing container status..."
    
    local services=("postgres" "redis" "localstack" "mailhog" "pgadmin")
    
    for service in "${services[@]}"; do
        if docker-compose -f $COMPOSE_FILE ps "$service" | grep -q "Up"; then
            add_result "Container $service" "PASS" "Container is running"
        else
            add_result "Container $service" "FAIL" "Container is not running"
        fi
    done
}

# Function to test PostgreSQL connection
test_postgres() {
    print_status "Testing PostgreSQL connection..."
    
    # Test database connection
    if docker-compose -f $COMPOSE_FILE exec -T postgres pg_isready -U postgres -d case_management_dev > /dev/null 2>&1; then
        add_result "PostgreSQL Connection" "PASS" "Database is accepting connections"
    else
        add_result "PostgreSQL Connection" "FAIL" "Cannot connect to database"
        return 1
    fi
    
    # Test database existence
    local db_exists=$(docker-compose -f $COMPOSE_FILE exec -T postgres psql -U postgres -lqt | cut -d \| -f 1 | grep -w case_management_dev | wc -l)
    if [ "$db_exists" -eq 1 ]; then
        add_result "PostgreSQL Database" "PASS" "case_management_dev database exists"
    else
        add_result "PostgreSQL Database" "FAIL" "case_management_dev database not found"
    fi
    
    # Test test database existence
    local test_db_exists=$(docker-compose -f $COMPOSE_FILE exec -T postgres psql -U postgres -lqt | cut -d \| -f 1 | grep -w case_management_test | wc -l)
    if [ "$test_db_exists" -eq 1 ]; then
        add_result "PostgreSQL Test DB" "PASS" "case_management_test database exists"
    else
        add_result "PostgreSQL Test DB" "FAIL" "case_management_test database not found"
    fi
    
    # Test table creation
    local table_count=$(docker-compose -f $COMPOSE_FILE exec -T postgres psql -U postgres -d case_management_dev -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d '[:space:]' || echo "0")
    if [ "$table_count" -gt 0 ]; then
        add_result "PostgreSQL Tables" "PASS" "$table_count tables found"
    else
        add_result "PostgreSQL Tables" "WARN" "No tables found (may need initialization)"
    fi
}

# Function to test Redis connection
test_redis() {
    print_status "Testing Redis connection..."
    
    if docker-compose -f $COMPOSE_FILE exec -T redis redis-cli ping > /dev/null 2>&1; then
        add_result "Redis Connection" "PASS" "Redis is responding to ping"
    else
        add_result "Redis Connection" "FAIL" "Redis is not responding"
        return 1
    fi
    
    # Test Redis info
    local redis_version=$(docker-compose -f $COMPOSE_FILE exec -T redis redis-cli info server | grep redis_version | cut -d: -f2 | tr -d '\r\n')
    if [ ! -z "$redis_version" ]; then
        add_result "Redis Version" "PASS" "Redis version: $redis_version"
    else
        add_result "Redis Version" "WARN" "Could not retrieve Redis version"
    fi
}

# Function to test LocalStack
test_localstack() {
    print_status "Testing LocalStack..."
    
    # Test LocalStack health endpoint
    if curl -s --max-time $TEST_TIMEOUT http://localhost:4566/_localstack/health > /dev/null 2>&1; then
        add_result "LocalStack Health" "PASS" "LocalStack health endpoint responding"
    else
        add_result "LocalStack Health" "FAIL" "LocalStack health endpoint not responding"
        return 1
    fi
    
    # Test S3 service
    if curl -s --max-time $TEST_TIMEOUT http://localhost:4566/_localstack/health | grep -q '"s3": "available"' 2>/dev/null; then
        add_result "LocalStack S3" "PASS" "S3 service is available"
    else
        add_result "LocalStack S3" "WARN" "S3 service may not be fully ready"
    fi
    
    # Test bucket creation (if awslocal is available)
    if command -v awslocal &> /dev/null; then
        export AWS_ACCESS_KEY_ID=test
        export AWS_SECRET_ACCESS_KEY=test
        export AWS_DEFAULT_REGION=us-east-1
        
        local bucket_count=$(awslocal s3 ls 2>/dev/null | wc -l || echo "0")
        if [ "$bucket_count" -gt 0 ]; then
            add_result "LocalStack Buckets" "PASS" "$bucket_count S3 buckets found"
        else
            add_result "LocalStack Buckets" "WARN" "No S3 buckets found (may need initialization)"
        fi
    else
        add_result "AWS CLI Local" "WARN" "awslocal not found, cannot test S3 buckets"
    fi
}

# Function to test MailHog
test_mailhog() {
    print_status "Testing MailHog..."
    
    # Test SMTP port
    if nc -z localhost 1025 2>/dev/null; then
        add_result "MailHog SMTP" "PASS" "SMTP server is listening on port 1025"
    else
        add_result "MailHog SMTP" "FAIL" "SMTP server is not accessible on port 1025"
    fi
    
    # Test Web UI
    if curl -s --max-time $TEST_TIMEOUT http://localhost:8025 > /dev/null 2>&1; then
        add_result "MailHog Web UI" "PASS" "Web UI is accessible at http://localhost:8025"
    else
        add_result "MailHog Web UI" "FAIL" "Web UI is not accessible"
    fi
}

# Function to test pgAdmin
test_pgadmin() {
    print_status "Testing pgAdmin..."
    
    if curl -s --max-time $TEST_TIMEOUT http://localhost:5050 > /dev/null 2>&1; then
        add_result "pgAdmin Web UI" "PASS" "pgAdmin is accessible at http://localhost:5050"
    else
        add_result "pgAdmin Web UI" "WARN" "pgAdmin web interface is not accessible"
    fi
}

# Function to test port availability
test_ports() {
    print_status "Testing port availability..."
    
    local ports=("5432:PostgreSQL" "6379:Redis" "4566:LocalStack" "1025:MailHog SMTP" "8025:MailHog Web" "5050:pgAdmin")
    
    for port_info in "${ports[@]}"; do
        IFS=':' read -r port service <<< "$port_info"
        if nc -z localhost "$port" 2>/dev/null; then
            add_result "Port $port" "PASS" "$service is listening on port $port"
        else
            add_result "Port $port" "FAIL" "$service is not listening on port $port"
        fi
    done
}

# Function to test environment file
test_environment() {
    print_status "Testing environment configuration..."
    
    if [ -f ".env.dev" ]; then
        add_result "Environment File" "PASS" ".env.dev file exists"
        
        # Check for required variables
        local required_vars=("DATABASE_URL" "REDIS_URL" "S3_ENDPOINT" "SMTP_HOST")
        for var in "${required_vars[@]}"; do
            if grep -q "^$var=" .env.dev; then
                add_result "Env Var $var" "PASS" "$var is configured"
            else
                add_result "Env Var $var" "WARN" "$var is not configured"
            fi
        done
    else
        add_result "Environment File" "WARN" ".env.dev file not found"
    fi
}

# Function to run integration test
test_integration() {
    print_status "Running integration test..."
    
    # Test database query
    local test_query="SELECT version();"
    if docker-compose -f $COMPOSE_FILE exec -T postgres psql -U postgres -d case_management_dev -c "$test_query" > /dev/null 2>&1; then
        add_result "Database Query" "PASS" "Can execute queries on database"
    else
        add_result "Database Query" "FAIL" "Cannot execute queries on database"
    fi
    
    # Test Redis operations
    if docker-compose -f $COMPOSE_FILE exec -T redis redis-cli set test_key "test_value" > /dev/null 2>&1 && \
       docker-compose -f $COMPOSE_FILE exec -T redis redis-cli get test_key > /dev/null 2>&1; then
        add_result "Redis Operations" "PASS" "Can perform Redis set/get operations"
        docker-compose -f $COMPOSE_FILE exec -T redis redis-cli del test_key > /dev/null 2>&1
    else
        add_result "Redis Operations" "FAIL" "Cannot perform Redis operations"
    fi
}

# Function to print summary
print_summary() {
    echo ""
    echo "=========================================="
    echo "         VALIDATION SUMMARY"
    echo "=========================================="
    echo ""
    
    local total_tests=${#validation_results[@]}
    local passed_tests=$((total_tests - failed_tests))
    
    printf "%-25s %s\n" "Total Tests:" "$total_tests"
    printf "%-25s %s\n" "Passed:" "$passed_tests"
    printf "%-25s %s\n" "Failed:" "$failed_tests"
    echo ""
    
    if [ $failed_tests -eq 0 ]; then
        print_success "All validation tests passed! Environment is ready for development."
        echo ""
        echo "Service URLs:"
        echo "  PostgreSQL:     localhost:5432"
        echo "  Redis:          localhost:6379"
        echo "  LocalStack:     http://localhost:4566"
        echo "  MailHog Web:    http://localhost:8025"
        echo "  pgAdmin:        http://localhost:5050"
        echo ""
        echo "Default Credentials:"
        echo "  PostgreSQL:     postgres / postgres_dev_password"
        echo "  pgAdmin:        admin@casemanagement.dev / admin123"
        echo "  LocalStack:     test / test"
        return 0
    else
        print_error "Some validation tests failed. Please check the issues above."
        echo ""
        echo "To fix common issues:"
        echo "  1. Ensure all services are started: ./scripts/docker-dev.sh start"
        echo "  2. Check service logs: ./scripts/docker-dev.sh logs"
        echo "  3. Restart services: ./scripts/docker-dev.sh restart"
        return 1
    fi
}

# Main execution
main() {
    echo "Case Management Docker Environment Validation"
    echo "=============================================="
    echo ""
    
    # Run all tests
    test_docker
    test_docker_compose
    test_environment
    test_containers
    test_ports
    test_postgres
    test_redis
    test_localstack
    test_mailhog
    test_pgadmin
    test_integration
    
    # Print summary
    print_summary
    
    # Exit with appropriate code
    if [ $failed_tests -eq 0 ]; then
        exit 0
    else
        exit 1
    fi
}

# Check if script is being sourced or executed
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi