# Case Management Development Environment Makefile

.PHONY: help dev-start dev-stop dev-restart dev-status dev-logs dev-clean dev-validate dev-backup dev-reset

# Default target
help: ## Show this help message
	@echo "Case Management Development Environment"
	@echo "======================================"
	@echo ""
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "Examples:"
	@echo "  make dev-start     # Start development environment"
	@echo "  make dev-logs      # Show all service logs"
	@echo "  make dev-validate  # Validate environment setup"

# Docker Development Environment Commands
dev-start: ## Start all development services
	@chmod +x scripts/docker-dev.sh
	@scripts/docker-dev.sh start

dev-stop: ## Stop all development services
	@chmod +x scripts/docker-dev.sh
	@scripts/docker-dev.sh stop

dev-restart: ## Restart all development services
	@chmod +x scripts/docker-dev.sh
	@scripts/docker-dev.sh restart

dev-status: ## Show status of all services
	@chmod +x scripts/docker-dev.sh
	@scripts/docker-dev.sh status

dev-logs: ## Show logs for all services
	@chmod +x scripts/docker-dev.sh
	@scripts/docker-dev.sh logs

dev-logs-postgres: ## Show PostgreSQL logs
	@chmod +x scripts/docker-dev.sh
	@scripts/docker-dev.sh logs postgres

dev-logs-redis: ## Show Redis logs
	@chmod +x scripts/docker-dev.sh
	@scripts/docker-dev.sh logs redis

dev-logs-localstack: ## Show LocalStack logs
	@chmod +x scripts/docker-dev.sh
	@scripts/docker-dev.sh logs localstack

dev-logs-mailhog: ## Show MailHog logs
	@chmod +x scripts/docker-dev.sh
	@scripts/docker-dev.sh logs mailhog

dev-clean: ## Stop services and remove all data
	@chmod +x scripts/docker-dev.sh
	@scripts/docker-dev.sh cleanup

dev-reset: ## Reset database to initial state
	@chmod +x scripts/docker-dev.sh
	@scripts/docker-dev.sh reset-db

dev-backup: ## Create database backup
	@chmod +x scripts/docker-dev.sh
	@scripts/docker-dev.sh backup

dev-validate: ## Validate development environment
	@chmod +x scripts/validate-docker-env.sh
	@scripts/validate-docker-env.sh

# Quick setup commands
setup: ## Initial setup of development environment
	@echo "Setting up Case Management development environment..."
	@chmod +x scripts/docker-dev.sh
	@chmod +x scripts/validate-docker-env.sh
	@chmod +x scripts/check-prerequisites.sh
	@chmod +x docker/localstack/init/*.sh
	@echo "✓ Made scripts executable"
	@echo "✓ Setup complete! Run 'make dev-start' to start services"

check-prereqs: ## Check prerequisites before starting
	@chmod +x scripts/check-prerequisites.sh
	@scripts/check-prerequisites.sh

quick-start: setup check-prereqs dev-start dev-validate ## Quick setup and start with validation

# Database management
db-connect: ## Connect to PostgreSQL database
	@docker-compose -f docker-compose.dev.yml exec postgres psql -U postgres -d case_management_dev

db-test-connect: ## Connect to test database
	@docker-compose -f docker-compose.dev.yml exec postgres psql -U postgres -d case_management_test

redis-cli: ## Connect to Redis CLI
	@docker-compose -f docker-compose.dev.yml exec redis redis-cli

# Service URLs (informational targets)
urls: ## Show service URLs and credentials
	@echo "Development Service URLs:"
	@echo "========================="
	@echo ""
	@echo "PostgreSQL Database:"
	@echo "  Host: localhost:5433"
	@echo "  Database: case_management_dev"
	@echo "  Username: postgres"
	@echo "  Password: postgres_dev_password"
	@echo ""
	@echo "Redis Cache:"
	@echo "  Host: localhost:6379"
	@echo ""
	@echo "LocalStack (AWS):"
	@echo "  S3 Endpoint: http://localhost:4566"
	@echo "  Access Key: test"
	@echo "  Secret Key: test"
	@echo ""
	@echo "MailHog:"
	@echo "  SMTP: localhost:1025"
	@echo "  Web UI: http://localhost:8025"
	@echo ""
	@echo "pgAdmin:"
	@echo "  Web UI: http://localhost:5050"
	@echo "  Email: admin@casemanagement.dev"
	@echo "  Password: admin123"

# Health checks
health: ## Check health of all services
	@echo "Checking service health..."
	@echo ""
	@echo "PostgreSQL:"
	@docker-compose -f docker-compose.dev.yml exec postgres pg_isready -U postgres -d case_management_dev || echo "  ✗ Not ready"
	@echo ""
	@echo "Redis:"
	@docker-compose -f docker-compose.dev.yml exec redis redis-cli ping || echo "  ✗ Not ready"
	@echo ""
	@echo "LocalStack:"
	@curl -s http://localhost:4566/_localstack/health > /dev/null && echo "  ✓ Ready" || echo "  ✗ Not ready"
	@echo ""
	@echo "MailHog:"
	@curl -s http://localhost:8025 > /dev/null && echo "  ✓ Ready" || echo "  ✗ Not ready"

# Cleanup and maintenance
clean-logs: ## Clean up log files
	@echo "Cleaning up log files..."
	@rm -rf logs/*.log
	@echo "✓ Log files cleaned"

clean-docker: ## Clean Docker system (images, containers, volumes)
	@echo "Cleaning Docker system..."
	@docker system prune -f
	@echo "✓ Docker system cleaned"

# Development workflow helpers
dev-full-reset: dev-stop clean-docker dev-start dev-validate ## Full reset: stop, clean, start, validate

dev-quick-reset: dev-restart dev-validate ## Quick reset: restart and validate

# Show environment info
env-info: ## Show environment information
	@echo "Environment Information:"
	@echo "======================="
	@echo "Docker version: $(shell docker --version)"
	@echo "Docker Compose version: $(shell docker-compose --version)"
	@echo "Current directory: $(shell pwd)"
	@echo "Environment file: $(shell [ -f .env.dev ] && echo "✓ .env.dev exists" || echo "✗ .env.dev missing")"
	@echo "Compose file: $(shell [ -f docker-compose.dev.yml ] && echo "✓ docker-compose.dev.yml exists" || echo "✗ docker-compose.dev.yml missing")"