# =============================================================================
# Case Management System - Development Makefile
# =============================================================================
# 
# This Makefile provides convenient commands for managing the Case Management
# System development environment, supporting the multi-agent development approach.
#
# Usage: make [target]
# Example: make dev-start
#
# =============================================================================

.PHONY: help install dev-start dev-stop test lint format clean build deploy health-check docker-dev docker-prod

# Default target
.DEFAULT_GOAL := help

# =============================================================================
# Configuration
# =============================================================================

# Project directories
BACKEND_DIR := backend
FRONTEND_DIR := frontend
SCRIPTS_DIR := scripts
DOCKER_COMPOSE_DEV := docker-compose.dev.yml
DOCKER_COMPOSE_PROD := docker-compose.prod.yml

# Colors for output
GREEN := \033[0;32m
BLUE := \033[0;34m
YELLOW := \033[1;33m
RED := \033[0;31m
NC := \033[0m # No Color

# Node.js and npm commands
NPM_BACKEND := cd $(BACKEND_DIR) && npm
NPM_FRONTEND := cd $(FRONTEND_DIR) && npm

# =============================================================================
# Help Target
# =============================================================================

help: ## Display this help message
	@echo "$(BLUE)Case Management System - Development Commands$(NC)"
	@echo "=================================================="
	@echo ""
	@echo "$(GREEN)Setup Commands:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | grep -E "install|setup|clean" | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(GREEN)Development Commands:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | grep -E "dev-|start|stop" | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(GREEN)Testing & Quality:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | grep -E "test|lint|format|security" | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(GREEN)Build & Deploy:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | grep -E "build|deploy|docker" | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(GREEN)Database Commands:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | grep -E "db-|database|migrate|seed" | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(GREEN)Utility Commands:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | grep -E "health|logs|monitor|backup" | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""

# =============================================================================
# Setup Commands
# =============================================================================

install: ## Install all dependencies and setup development environment
	@echo "$(BLUE)Installing development environment...$(NC)"
	@./scripts/dev-setup.sh
	@echo "$(GREEN)✅ Installation complete!$(NC)"

install-quick: ## Quick install without optional components
	@echo "$(BLUE)Quick installation...$(NC)"
	@./scripts/dev-setup.sh --quick
	@echo "$(GREEN)✅ Quick installation complete!$(NC)"

install-backend: ## Install backend dependencies only
	@echo "$(BLUE)Installing backend dependencies...$(NC)"
	@$(NPM_BACKEND) ci
	@$(NPM_BACKEND) run prisma:generate
	@echo "$(GREEN)✅ Backend dependencies installed!$(NC)"

install-frontend: ## Install frontend dependencies only
	@echo "$(BLUE)Installing frontend dependencies...$(NC)"
	@$(NPM_FRONTEND) ci
	@echo "$(GREEN)✅ Frontend dependencies installed!$(NC)"

setup-env: ## Setup environment files from templates
	@echo "$(BLUE)Setting up environment files...$(NC)"
	@if [ ! -f $(BACKEND_DIR)/.env ]; then \
		cp $(BACKEND_DIR)/.env.example $(BACKEND_DIR)/.env; \
		echo "$(GREEN)✅ Created backend/.env$(NC)"; \
	fi
	@if [ ! -f $(FRONTEND_DIR)/.env.local ]; then \
		echo "NEXT_PUBLIC_API_URL=http://localhost:3001/api" > $(FRONTEND_DIR)/.env.local; \
		echo "$(GREEN)✅ Created frontend/.env.local$(NC)"; \
	fi

# =============================================================================
# Development Commands
# =============================================================================

dev-start: ## Start all development services
	@echo "$(BLUE)Starting development environment...$(NC)"
	@if [ -f $(DOCKER_COMPOSE_DEV) ]; then \
		docker-compose -f $(DOCKER_COMPOSE_DEV) up -d; \
		echo "$(GREEN)✅ Docker services started$(NC)"; \
	fi
	@echo "$(YELLOW)Starting backend service...$(NC)"
	@$(NPM_BACKEND) run start:dev &
	@echo "$(YELLOW)Starting frontend service...$(NC)"
	@$(NPM_FRONTEND) run dev &
	@echo "$(GREEN)🚀 Development environment is starting!$(NC)"
	@echo "Frontend: http://localhost:3000"
	@echo "Backend API: http://localhost:3001/api"
	@echo "API Docs: http://localhost:3001/api/docs"

dev-stop: ## Stop all development services
	@echo "$(BLUE)Stopping development environment...$(NC)"
	@pkill -f "npm run start:dev" || true
	@pkill -f "next dev" || true
	@if [ -f $(DOCKER_COMPOSE_DEV) ]; then \
		docker-compose -f $(DOCKER_COMPOSE_DEV) down; \
		echo "$(GREEN)✅ Docker services stopped$(NC)"; \
	fi
	@echo "$(GREEN)✅ Development environment stopped$(NC)"

dev-restart: dev-stop dev-start ## Restart all development services

start-backend: ## Start backend service only
	@echo "$(BLUE)Starting backend service...$(NC)"
	@$(NPM_BACKEND) run start:dev

start-frontend: ## Start frontend service only
	@echo "$(BLUE)Starting frontend service...$(NC)"
	@$(NPM_FRONTEND) run dev

# =============================================================================
# Testing & Quality Commands
# =============================================================================

test: ## Run all tests
	@echo "$(BLUE)Running all tests...$(NC)"
	@$(NPM_BACKEND) run test
	@$(NPM_FRONTEND) run test
	@echo "$(GREEN)✅ All tests completed!$(NC)"

test-backend: ## Run backend tests only
	@echo "$(BLUE)Running backend tests...$(NC)"
	@$(NPM_BACKEND) run test

test-frontend: ## Run frontend tests only
	@echo "$(BLUE)Running frontend tests...$(NC)"
	@$(NPM_FRONTEND) run test

test-watch-backend: ## Run backend tests in watch mode
	@echo "$(BLUE)Running backend tests in watch mode...$(NC)"
	@$(NPM_BACKEND) run test:watch

test-watch-frontend: ## Run frontend tests in watch mode
	@echo "$(BLUE)Running frontend tests in watch mode...$(NC)"
	@$(NPM_FRONTEND) run test:watch

test-coverage: ## Run tests with coverage reports
	@echo "$(BLUE)Running tests with coverage...$(NC)"
	@$(NPM_BACKEND) run test:cov
	@$(NPM_FRONTEND) run test:coverage
	@echo "$(GREEN)✅ Coverage reports generated!$(NC)"

test-e2e: ## Run end-to-end tests
	@echo "$(BLUE)Running end-to-end tests...$(NC)"
	@$(NPM_BACKEND) run test:e2e
	@echo "$(GREEN)✅ E2E tests completed!$(NC)"

lint: ## Run linting for all projects
	@echo "$(BLUE)Running linters...$(NC)"
	@$(NPM_BACKEND) run lint
	@$(NPM_FRONTEND) run lint
	@echo "$(GREEN)✅ Linting completed!$(NC)"

lint-fix: ## Run linting with auto-fix
	@echo "$(BLUE)Running linters with auto-fix...$(NC)"
	@$(NPM_BACKEND) run lint --fix || true
	@$(NPM_FRONTEND) run lint --fix || true
	@echo "$(GREEN)✅ Linting with auto-fix completed!$(NC)"

format: ## Format code with Prettier
	@echo "$(BLUE)Formatting code...$(NC)"
	@$(NPM_BACKEND) run format
	@$(NPM_FRONTEND) run format
	@echo "$(GREEN)✅ Code formatting completed!$(NC)"

type-check: ## Run TypeScript type checking
	@echo "$(BLUE)Running TypeScript type checking...$(NC)"
	@$(NPM_BACKEND) run build --noEmit || $(NPM_BACKEND) run type-check
	@$(NPM_FRONTEND) run type-check
	@echo "$(GREEN)✅ Type checking completed!$(NC)"

security-audit: ## Run security audit
	@echo "$(BLUE)Running security audit...$(NC)"
	@$(NPM_BACKEND) audit
	@$(NPM_FRONTEND) audit
	@echo "$(GREEN)✅ Security audit completed!$(NC)"

# =============================================================================
# Build Commands
# =============================================================================

build: ## Build all projects for production
	@echo "$(BLUE)Building all projects...$(NC)"
	@$(NPM_BACKEND) run build
	@$(NPM_FRONTEND) run build
	@echo "$(GREEN)✅ Build completed!$(NC)"

build-backend: ## Build backend for production
	@echo "$(BLUE)Building backend...$(NC)"
	@$(NPM_BACKEND) run build
	@echo "$(GREEN)✅ Backend build completed!$(NC)"

build-frontend: ## Build frontend for production
	@echo "$(BLUE)Building frontend...$(NC)"
	@$(NPM_FRONTEND) run build
	@echo "$(GREEN)✅ Frontend build completed!$(NC)"

# =============================================================================
# Database Commands
# =============================================================================

db-generate: ## Generate Prisma client
	@echo "$(BLUE)Generating Prisma client...$(NC)"
	@$(NPM_BACKEND) run prisma:generate
	@echo "$(GREEN)✅ Prisma client generated!$(NC)"

db-migrate: ## Run database migrations
	@echo "$(BLUE)Running database migrations...$(NC)"
	@$(NPM_BACKEND) run prisma:migrate
	@echo "$(GREEN)✅ Database migrations completed!$(NC)"

db-migrate-deploy: ## Deploy database migrations (production)
	@echo "$(BLUE)Deploying database migrations...$(NC)"
	@$(NPM_BACKEND) run prisma:deploy
	@echo "$(GREEN)✅ Database migrations deployed!$(NC)"

db-seed: ## Seed database with demo data
	@echo "$(BLUE)Seeding database...$(NC)"
	@$(NPM_BACKEND) run seed
	@echo "$(GREEN)✅ Database seeded!$(NC)"

db-studio: ## Open Prisma Studio
	@echo "$(BLUE)Opening Prisma Studio...$(NC)"
	@$(NPM_BACKEND) run prisma:studio

db-reset: ## Reset database and reseed
	@echo "$(BLUE)Resetting database...$(NC)"
	@$(NPM_BACKEND) run prisma:migrate reset --force
	@echo "$(GREEN)✅ Database reset completed!$(NC)"

# =============================================================================
# Docker Commands
# =============================================================================

docker-dev: ## Start development environment with Docker
	@echo "$(BLUE)Starting development environment with Docker...$(NC)"
	@docker-compose -f $(DOCKER_COMPOSE_DEV) up -d
	@echo "$(GREEN)✅ Development environment started!$(NC)"

docker-dev-build: ## Build and start development environment
	@echo "$(BLUE)Building and starting development environment...$(NC)"
	@docker-compose -f $(DOCKER_COMPOSE_DEV) up -d --build
	@echo "$(GREEN)✅ Development environment built and started!$(NC)"

docker-dev-stop: ## Stop development Docker environment
	@echo "$(BLUE)Stopping development environment...$(NC)"
	@docker-compose -f $(DOCKER_COMPOSE_DEV) down
	@echo "$(GREEN)✅ Development environment stopped!$(NC)"

docker-prod: ## Start production environment with Docker
	@echo "$(BLUE)Starting production environment with Docker...$(NC)"
	@docker-compose -f $(DOCKER_COMPOSE_PROD) up -d
	@echo "$(GREEN)✅ Production environment started!$(NC)"

docker-prod-build: ## Build and start production environment
	@echo "$(BLUE)Building and starting production environment...$(NC)"
	@docker-compose -f $(DOCKER_COMPOSE_PROD) up -d --build
	@echo "$(GREEN)✅ Production environment built and started!$(NC)"

docker-prod-stop: ## Stop production Docker environment
	@echo "$(BLUE)Stopping production environment...$(NC)"
	@docker-compose -f $(DOCKER_COMPOSE_PROD) down
	@echo "$(GREEN)✅ Production environment stopped!$(NC)"

docker-logs: ## View Docker container logs
	@docker-compose -f $(DOCKER_COMPOSE_DEV) logs -f

# =============================================================================
# Utility Commands
# =============================================================================

health-check: ## Check health of all services
	@echo "$(BLUE)Checking service health...$(NC)"
	@echo "Backend Health:"
	@curl -s http://localhost:3001/api/health | jq '.' || echo "❌ Backend not responding"
	@echo ""
	@echo "Detailed Health:"
	@curl -s http://localhost:3001/api/health/detailed | jq '.' || echo "❌ Backend not responding"
	@echo ""
	@echo "Frontend:"
	@curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:3000 || echo "❌ Frontend not responding"

logs: ## View application logs
	@echo "$(BLUE)Viewing application logs...$(NC)"
	@if [ -f logs/combined.log ]; then tail -f logs/combined.log; else echo "No logs found"; fi

logs-error: ## View error logs only
	@echo "$(BLUE)Viewing error logs...$(NC)"
	@if [ -f logs/error.log ]; then tail -f logs/error.log; else echo "No error logs found"; fi

monitor: ## Monitor system resources
	@echo "$(BLUE)Monitoring system resources...$(NC)"
	@if command -v htop >/dev/null 2>&1; then \
		htop; \
	else \
		top; \
	fi

# =============================================================================
# Clean Commands
# =============================================================================

clean: ## Clean all build artifacts and dependencies
	@echo "$(BLUE)Cleaning all build artifacts...$(NC)"
	@rm -rf $(BACKEND_DIR)/node_modules
	@rm -rf $(FRONTEND_DIR)/node_modules
	@rm -rf $(BACKEND_DIR)/dist
	@rm -rf $(FRONTEND_DIR)/.next
	@rm -rf $(FRONTEND_DIR)/out
	@rm -rf logs/*
	@echo "$(GREEN)✅ Cleanup completed!$(NC)"

clean-build: ## Clean build artifacts only
	@echo "$(BLUE)Cleaning build artifacts...$(NC)"
	@rm -rf $(BACKEND_DIR)/dist
	@rm -rf $(FRONTEND_DIR)/.next
	@rm -rf $(FRONTEND_DIR)/out
	@echo "$(GREEN)✅ Build artifacts cleaned!$(NC)"

clean-deps: ## Clean dependencies (node_modules)
	@echo "$(BLUE)Cleaning dependencies...$(NC)"
	@rm -rf $(BACKEND_DIR)/node_modules
	@rm -rf $(FRONTEND_DIR)/node_modules
	@echo "$(GREEN)✅ Dependencies cleaned!$(NC)"

clean-logs: ## Clean log files
	@echo "$(BLUE)Cleaning log files...$(NC)"
	@rm -rf logs/*
	@mkdir -p logs
	@echo "$(GREEN)✅ Log files cleaned!$(NC)"

# =============================================================================
# Advanced Commands
# =============================================================================

benchmark: ## Run performance benchmarks
	@echo "$(BLUE)Running performance benchmarks...$(NC)"
	@echo "This would run performance tests... (not implemented yet)"

deploy-staging: ## Deploy to staging environment
	@echo "$(BLUE)Deploying to staging...$(NC)"
	@echo "This would deploy to staging... (not implemented yet)"

deploy-production: ## Deploy to production environment
	@echo "$(BLUE)Deploying to production...$(NC)"
	@echo "This would deploy to production... (not implemented yet)"

backup-db: ## Backup database
	@echo "$(BLUE)Backing up database...$(NC)"
	@pg_dump -h localhost -U case_user case_management_dev > backup-$(shell date +%Y%m%d-%H%M%S).sql
	@echo "$(GREEN)✅ Database backup completed!$(NC)"

# =============================================================================
# Development Workflow Commands
# =============================================================================

pr-check: test lint type-check security-audit ## Run all checks before creating PR
	@echo "$(GREEN)✅ All PR checks passed! Ready to create pull request.$(NC)"

quick-start: install dev-start ## Quick start for new developers
	@echo "$(GREEN)🚀 Development environment is ready!$(NC)"
	@echo ""
	@echo "Access your services:"
	@echo "- Frontend: http://localhost:3000"
	@echo "- Backend API: http://localhost:3001/api"
	@echo "- API Documentation: http://localhost:3001/api/docs"
	@echo "- Prisma Studio: make db-studio"

# =============================================================================
# N8N Integration Commands
# =============================================================================

n8n-start: ## Start n8n workflow automation
	@echo "$(BLUE)Starting n8n...$(NC)"
	@if [ -f $(DOCKER_COMPOSE_DEV) ]; then \
		docker-compose -f $(DOCKER_COMPOSE_DEV) up -d n8n; \
		echo "$(GREEN)✅ n8n started at http://localhost:5678$(NC)"; \
	else \
		echo "$(RED)❌ Docker compose file not found$(NC)"; \
	fi

n8n-stop: ## Stop n8n
	@echo "$(BLUE)Stopping n8n...$(NC)"
	@docker-compose -f $(DOCKER_COMPOSE_DEV) stop n8n
	@echo "$(GREEN)✅ n8n stopped$(NC)"

n8n-test: ## Test n8n webhook integration
	@echo "$(BLUE)Testing n8n integration...$(NC)"
	@curl -X POST http://localhost:3001/api/n8n-test \
		-H "Content-Type: application/json" \
		-d '{"message": "Test from Makefile", "timestamp": "$(shell date -Iseconds)"}' | jq '.'

# =============================================================================
# Git Workflow Commands
# =============================================================================

git-setup: ## Setup Git hooks and configuration
	@echo "$(BLUE)Setting up Git hooks...$(NC)"
	@if [ -d .git ]; then \
		echo "#!/bin/sh\nmake pr-check" > .git/hooks/pre-push; \
		chmod +x .git/hooks/pre-push; \
		echo "$(GREEN)✅ Git pre-push hook installed$(NC)"; \
	else \
		echo "$(RED)❌ Not in a Git repository$(NC)"; \
	fi

# =============================================================================
# Multi-Agent Development Support
# =============================================================================

agent-backend: ## Setup environment for backend development
	@echo "$(BLUE)Setting up backend development environment...$(NC)"
	@./scripts/dev-setup.sh --backend
	@$(NPM_BACKEND) run start:dev

agent-frontend: ## Setup environment for frontend development
	@echo "$(BLUE)Setting up frontend development environment...$(NC)"
	@./scripts/dev-setup.sh --frontend
	@$(NPM_FRONTEND) run dev

agent-database: ## Setup database development environment
	@echo "$(BLUE)Setting up database development environment...$(NC)"
	@make docker-dev
	@make db-migrate
	@make db-seed
	@make db-studio

agent-devops: ## Setup DevOps development environment
	@echo "$(BLUE)Setting up DevOps development environment...$(NC)"
	@make docker-dev
	@make health-check
	@make logs

# =============================================================================
# Documentation Commands
# =============================================================================

docs: ## Generate project documentation
	@echo "$(BLUE)Generating project documentation...$(NC)"
	@echo "This would generate documentation... (not implemented yet)"

api-docs: ## Open API documentation
	@echo "$(BLUE)Opening API documentation...$(NC)"
	@open http://localhost:3001/api/docs || echo "Visit: http://localhost:3001/api/docs"

# =============================================================================
# Status Commands
# =============================================================================

status: ## Show project status
	@echo "$(BLUE)Case Management System Status$(NC)"
	@echo "================================"
	@echo ""
	@echo "$(YELLOW)Services:$(NC)"
	@curl -s http://localhost:3001/api/health >/dev/null 2>&1 && echo "✅ Backend (http://localhost:3001)" || echo "❌ Backend (http://localhost:3001)"
	@curl -s http://localhost:3000 >/dev/null 2>&1 && echo "✅ Frontend (http://localhost:3000)" || echo "❌ Frontend (http://localhost:3000)"
	@docker ps --filter "name=postgres" --format "table {{.Names}}\t{{.Status}}" | grep -q postgres && echo "✅ PostgreSQL (Docker)" || echo "❌ PostgreSQL (Docker)"
	@echo ""
	@echo "$(YELLOW)Quick Commands:$(NC)"
	@echo "  make dev-start     # Start all services"
	@echo "  make test          # Run all tests"
	@echo "  make health-check  # Check service health"
	@echo "  make help          # Show all commands"

version: ## Show version information
	@echo "$(BLUE)Case Management System$(NC)"
	@echo "Version: 1.0.0 (Phase 0)"
	@echo "Node.js: $(shell node --version 2>/dev/null || echo 'Not installed')"
	@echo "npm: $(shell npm --version 2>/dev/null || echo 'Not installed')"
	@echo "Docker: $(shell docker --version 2>/dev/null | cut -d' ' -f3 | sed 's/,//' || echo 'Not installed')"
	@echo "PostgreSQL: $(shell psql --version 2>/dev/null | cut -d' ' -f3 || echo 'Not installed')"