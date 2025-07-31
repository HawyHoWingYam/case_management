#!/bin/bash

# Case Management Docker Development Environment Management Script
# This script provides easy commands to manage the development environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.dev.yml"
ENV_FILE=".env.dev"
PROJECT_NAME="case_management"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

# Function to check if docker-compose file exists
check_compose_file() {
    if [ ! -f "$COMPOSE_FILE" ]; then
        print_error "Docker compose file '$COMPOSE_FILE' not found."
        exit 1
    fi
}

# Function to start all services
start_services() {
    print_status "Starting Case Management development environment..."
    check_docker
    check_compose_file
    
    # Make init scripts executable
    chmod +x docker/localstack/init/*.sh
    
    # Load environment variables
    if [ -f "$ENV_FILE" ]; then
        export $(cat $ENV_FILE | grep -v '^#' | xargs)
        print_status "Loaded environment variables from $ENV_FILE"
    fi
    
    # Start services
    docker-compose -f $COMPOSE_FILE up -d
    
    print_success "Services started successfully!"
    print_status "Waiting for services to be ready..."
    
    # Wait for services to be healthy
    wait_for_services
    show_service_status
}

# Function to stop all services
stop_services() {
    print_status "Stopping Case Management development environment..."
    docker-compose -f $COMPOSE_FILE down
    print_success "Services stopped successfully!"
}

# Function to restart all services
restart_services() {
    print_status "Restarting Case Management development environment..."
    stop_services
    start_services
}

# Function to show logs
show_logs() {
    if [ -z "$1" ]; then
        print_status "Showing logs for all services..."
        docker-compose -f $COMPOSE_FILE logs -f
    else
        print_status "Showing logs for service: $1"
        docker-compose -f $COMPOSE_FILE logs -f "$1"
    fi
}

# Function to wait for services to be ready
wait_for_services() {
    local max_attempts=30
    local attempt=1
    
    print_status "Waiting for PostgreSQL to be ready..."
    while [ $attempt -le $max_attempts ]; do
        if docker-compose -f $COMPOSE_FILE exec -T postgres pg_isready -U postgres -d case_management_dev > /dev/null 2>&1; then
            print_success "PostgreSQL is ready!"
            break
        fi
        sleep 2
        attempt=$((attempt + 1))
    done
    
    if [ $attempt -gt $max_attempts ]; then
        print_error "PostgreSQL failed to start within expected time"
        return 1
    fi
    
    print_status "Waiting for Redis to be ready..."
    attempt=1
    while [ $attempt -le $max_attempts ]; do
        if docker-compose -f $COMPOSE_FILE exec -T redis redis-cli ping > /dev/null 2>&1; then
            print_success "Redis is ready!"
            break
        fi
        sleep 2
        attempt=$((attempt + 1))
    done
    
    if [ $attempt -gt $max_attempts ]; then
        print_error "Redis failed to start within expected time"
        return 1
    fi
    
    print_status "Waiting for LocalStack to be ready..."
    attempt=1
    while [ $attempt -le $max_attempts ]; do
        if curl -s http://localhost:4566/_localstack/health > /dev/null 2>&1; then
            print_success "LocalStack is ready!"
            break
        fi
        sleep 3
        attempt=$((attempt + 1))
    done
    
    if [ $attempt -gt $max_attempts ]; then
        print_warning "LocalStack may not be fully ready yet"
    fi
}

# Function to show service status
show_service_status() {
    print_status "Service Status:"
    echo ""
    
    # PostgreSQL
    if docker-compose -f $COMPOSE_FILE ps postgres | grep -q "Up"; then
        print_success "PostgreSQL: Running on localhost:5432"
        echo "  - Development DB: case_management_dev"
        echo "  - Test DB: case_management_test"
        echo "  - Username: postgres"
        echo "  - Password: postgres_dev_password"
    else
        print_error "PostgreSQL: Not running"
    fi
    
    # Redis
    if docker-compose -f $COMPOSE_FILE ps redis | grep -q "Up"; then
        print_success "Redis: Running on localhost:6379"
    else
        print_error "Redis: Not running"
    fi
    
    # LocalStack
    if docker-compose -f $COMPOSE_FILE ps localstack | grep -q "Up"; then
        print_success "LocalStack: Running on localhost:4566"
        echo "  - S3 Endpoint: http://localhost:4566"
        echo "  - Access Key: test"
        echo "  - Secret Key: test"
    else
        print_error "LocalStack: Not running"
    fi
    
    # MailHog
    if docker-compose -f $COMPOSE_FILE ps mailhog | grep -q "Up"; then
        print_success "MailHog: Running"
        echo "  - SMTP: localhost:1025"
        echo "  - Web UI: http://localhost:8025"
    else
        print_error "MailHog: Not running"
    fi
    
    # pgAdmin
    if docker-compose -f $COMPOSE_FILE ps pgadmin | grep -q "Up"; then
        print_success "pgAdmin: Running on http://localhost:5050"
        echo "  - Email: admin@casemanagement.dev"
        echo "  - Password: admin123"
    else
        print_error "pgAdmin: Not running"
    fi
}

# Function to clean up (remove volumes)
cleanup() {
    print_warning "This will remove all data and volumes. Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        print_status "Stopping services and removing volumes..."
        docker-compose -f $COMPOSE_FILE down -v
        docker system prune -f
        print_success "Cleanup completed!"
    else
        print_status "Cleanup cancelled."
    fi
}

# Function to reset database
reset_db() {
    print_warning "This will reset the database and all data will be lost. Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        print_status "Resetting database..."
        docker-compose -f $COMPOSE_FILE stop postgres
        docker-compose -f $COMPOSE_FILE rm -f postgres
        docker volume rm ${PROJECT_NAME}_postgres_data
        docker-compose -f $COMPOSE_FILE up -d postgres
        wait_for_services
        print_success "Database reset completed!"
    else
        print_status "Database reset cancelled."
    fi
}

# Function to backup database
backup_db() {
    local backup_file="backup_$(date +%Y%m%d_%H%M%S).sql"
    print_status "Creating database backup: $backup_file"
    
    docker-compose -f $COMPOSE_FILE exec -T postgres pg_dump -U postgres case_management_dev > "$backup_file"
    print_success "Database backup created: $backup_file"
}

# Function to restore database
restore_db() {
    if [ -z "$1" ]; then
        print_error "Please provide backup file path"
        print_status "Usage: $0 restore <backup_file>"
        exit 1
    fi
    
    if [ ! -f "$1" ]; then
        print_error "Backup file '$1' not found"
        exit 1
    fi
    
    print_warning "This will restore the database from backup and current data will be lost. Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        print_status "Restoring database from: $1"
        docker-compose -f $COMPOSE_FILE exec -T postgres psql -U postgres -d case_management_dev < "$1"
        print_success "Database restored successfully!"
    else
        print_status "Database restore cancelled."
    fi
}

# Function to show help
show_help() {
    echo "Case Management Docker Development Environment Manager"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start           Start all development services"
    echo "  stop            Stop all development services"
    echo "  restart         Restart all development services"
    echo "  status          Show status of all services"
    echo "  logs [service]  Show logs (all services or specific service)"
    echo "  cleanup         Stop services and remove all volumes/data"
    echo "  reset-db        Reset database to initial state"
    echo "  backup          Create database backup"
    echo "  restore <file>  Restore database from backup file"
    echo "  help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start                    # Start all services"
    echo "  $0 logs postgres            # Show PostgreSQL logs"
    echo "  $0 restore backup.sql       # Restore from backup"
    echo ""
    echo "Service URLs:"
    echo "  PostgreSQL:     localhost:5432"
    echo "  Redis:          localhost:6379"
    echo "  LocalStack:     http://localhost:4566"
    echo "  MailHog Web:    http://localhost:8025"
    echo "  pgAdmin:        http://localhost:5050"
}

# Main script logic
case "${1:-}" in
    "start")
        start_services
        ;;
    "stop")
        stop_services
        ;;
    "restart")
        restart_services
        ;;
    "status")
        show_service_status
        ;;
    "logs")
        show_logs "$2"
        ;;
    "cleanup")
        cleanup
        ;;
    "reset-db")
        reset_db
        ;;
    "backup")
        backup_db
        ;;
    "restore")
        restore_db "$2"
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    "")
        print_error "No command provided"
        show_help
        exit 1
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac