#!/bin/bash

# Case Management Prerequisites Checker
# This script checks if all required tools are installed and configured

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

print_header() {
    echo -e "${BLUE}$1${NC}"
}

# Check results
all_good=true

print_header "Case Management System - Prerequisites Check"
print_header "=============================================="
echo ""

# Check Operating System
print_status "Checking operating system..."
case "$(uname -s)" in
    Darwin)
        print_success "macOS detected"
        ;;
    Linux)
        print_success "Linux detected"
        ;;
    MINGW*|MSYS*|CYGWIN*)
        print_success "Windows detected"
        ;;
    *)
        print_warning "Unknown operating system: $(uname -s)"
        ;;
esac

# Check Docker installation
print_status "Checking Docker installation..."
if command -v docker &> /dev/null; then
    docker_version=$(docker --version 2>/dev/null | cut -d' ' -f3 | cut -d',' -f1)
    print_success "Docker installed: $docker_version"
    
    # Check if Docker daemon is running
    if docker info &> /dev/null; then
        print_success "Docker daemon is running"
    else
        print_error "Docker daemon is not running"
        echo "  Please start Docker Desktop or Docker service:"
        case "$(uname -s)" in
            Darwin)
                echo "  - Open Docker Desktop application"
                echo "  - Or run: open -a Docker"
                ;;
            Linux)
                echo "  - Run: sudo systemctl start docker"
                echo "  - Or: sudo service docker start"
                ;;
            MINGW*|MSYS*|CYGWIN*)
                echo "  - Open Docker Desktop application"
                ;;
        esac
        all_good=false
    fi
else
    print_error "Docker is not installed"
    echo "  Please install Docker:"
    echo "  - macOS/Windows: Download Docker Desktop from https://docker.com"
    echo "  - Linux: Follow instructions at https://docs.docker.com/engine/install/"
    all_good=false
fi

# Check Docker Compose
print_status "Checking Docker Compose..."
if command -v docker-compose &> /dev/null; then
    compose_version=$(docker-compose --version 2>/dev/null | cut -d' ' -f4 | cut -d',' -f1)
    print_success "Docker Compose installed: $compose_version"
elif docker compose version &> /dev/null; then
    compose_version=$(docker compose version --short 2>/dev/null)
    print_success "Docker Compose (plugin) installed: $compose_version"
else
    print_error "Docker Compose is not available"
    echo "  Docker Compose should be included with Docker Desktop"
    echo "  For Linux, install with: sudo apt-get install docker-compose-plugin"
    all_good=false
fi

# Check curl
print_status "Checking curl..."
if command -v curl &> /dev/null; then
    print_success "curl is available"
else
    print_warning "curl is not installed (needed for health checks)"
    echo "  Install with:"
    echo "  - macOS: curl is usually pre-installed, try: xcode-select --install"
    echo "  - Linux: sudo apt-get install curl (Ubuntu/Debian) or sudo yum install curl (RHEL/CentOS)"
fi

# Check netcat
print_status "Checking netcat..."
if command -v nc &> /dev/null; then
    print_success "netcat is available"
elif command -v netcat &> /dev/null; then
    print_success "netcat is available"
else
    print_warning "netcat is not installed (needed for port checks)"
    echo "  Install with:"
    echo "  - macOS: nc is usually pre-installed"
    echo "  - Linux: sudo apt-get install netcat (Ubuntu/Debian) or sudo yum install nc (RHEL/CentOS)"
fi

# Check make
print_status "Checking make..."
if command -v make &> /dev/null; then
    print_success "make is available"
else
    print_warning "make is not installed (optional, but recommended)"
    echo "  Install with:"
    echo "  - macOS: xcode-select --install"
    echo "  - Linux: sudo apt-get install build-essential (Ubuntu/Debian)"
fi

# Check git
print_status "Checking git..."
if command -v git &> /dev/null; then
    git_version=$(git --version | cut -d' ' -f3)
    print_success "git installed: $git_version"
else
    print_warning "git is not installed"
    echo "  Install with:"
    echo "  - macOS: xcode-select --install"
    echo "  - Linux: sudo apt-get install git"
fi

# Check Node.js (for development)
print_status "Checking Node.js..."
if command -v node &> /dev/null; then
    node_version=$(node --version)
    print_success "Node.js installed: $node_version"
    
    # Check if version is acceptable (v16+)
    major_version=$(echo $node_version | cut -d'.' -f1 | cut -d'v' -f2)
    if [ "$major_version" -ge 16 ]; then
        print_success "Node.js version is compatible (v16+)"
    else
        print_warning "Node.js version is older than recommended (v16+)"
        echo "  Consider upgrading Node.js"
    fi
else
    print_warning "Node.js is not installed"
    echo "  Install with:"
    echo "  - Visit https://nodejs.org or use nvm"
    echo "  - macOS: brew install node"
    echo "  - Linux: Use your package manager or nvm"
fi

# Check npm
if command -v node &> /dev/null && command -v npm &> /dev/null; then
    npm_version=$(npm --version)
    print_success "npm installed: $npm_version"
fi

# Check available ports
print_status "Checking port availability..."
ports_to_check=("5432" "6379" "4566" "1025" "8025" "5050")
ports_in_use=()

for port in "${ports_to_check[@]}"; do
    if command -v nc &> /dev/null; then
        if nc -z localhost "$port" 2>/dev/null; then
            ports_in_use+=("$port")
        fi
    elif command -v netstat &> /dev/null; then
        if netstat -an | grep -q ":$port "; then
            ports_in_use+=("$port")
        fi
    fi
done

if [ ${#ports_in_use[@]} -eq 0 ]; then
    print_success "All required ports are available"
else
    print_warning "Some ports are already in use: ${ports_in_use[*]}"
    echo "  Services using these ports may conflict with the development environment"
    echo "  Port usage:"
    echo "    5432 - PostgreSQL"
    echo "    6379 - Redis"  
    echo "    4566 - LocalStack"
    echo "    1025 - MailHog SMTP"
    echo "    8025 - MailHog Web UI"
    echo "    5050 - pgAdmin"
fi

# Check disk space
print_status "Checking disk space..."
if command -v df &> /dev/null; then
    available_space=$(df -h . | awk 'NR==2 {print $4}')
    print_success "Available disk space: $available_space"
    
    # Extract numeric part for comparison (rough check)
    available_gb=$(echo $available_space | sed 's/[^0-9]*//g')
    if [ ! -z "$available_gb" ] && [ "$available_gb" -lt 5 ]; then
        print_warning "Low disk space. Docker images and volumes need several GB"
    fi
else
    print_warning "Cannot check available disk space"
fi

# Check project files
print_status "Checking project files..."
required_files=("docker-compose.dev.yml" ".env.dev" "scripts/docker-dev.sh" "scripts/validate-docker-env.sh")
missing_files=()

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        missing_files+=("$file")
    fi
done

if [ ${#missing_files[@]} -eq 0 ]; then
    print_success "All required project files are present"
else
    print_error "Missing required files: ${missing_files[*]}"
    echo "  Please ensure all Docker configuration files are created"
    all_good=false
fi

# Check script permissions
print_status "Checking script permissions..."
scripts=("scripts/docker-dev.sh" "scripts/validate-docker-env.sh" "docker/localstack/init/01-create-s3-buckets.sh")
non_executable=()

for script in "${scripts[@]}"; do
    if [ -f "$script" ] && [ ! -x "$script" ]; then
        non_executable+=("$script")
    fi
done

if [ ${#non_executable[@]} -eq 0 ]; then
    print_success "All scripts have proper permissions"
else
    print_warning "Some scripts are not executable: ${non_executable[*]}"
    echo "  Run: chmod +x ${non_executable[*]}"
fi

# Check AWS CLI Local (optional)
print_status "Checking AWS CLI Local (optional)..."
if command -v awslocal &> /dev/null; then
    print_success "awslocal is available for LocalStack testing"
elif command -v aws &> /dev/null; then
    print_success "AWS CLI is available (can be used with LocalStack)"
    echo "  Consider installing awslocal for easier LocalStack interaction:"
    echo "  pip install awscli-local"
else
    print_warning "AWS CLI not found (optional)"
    echo "  Install for S3 testing with LocalStack:"
    echo "  pip install awscli awscli-local"
fi

# Summary
echo ""
print_header "Prerequisites Check Summary"
print_header "============================"
echo ""

if [ "$all_good" = true ]; then
    print_success "All critical prerequisites are met!"
    echo ""
    echo "Next steps:"
    echo "  1. Start Docker Desktop (if not already running)"
    echo "  2. Run: make dev-start (or ./scripts/docker-dev.sh start)"
    echo "  3. Run: make dev-validate (or ./scripts/validate-docker-env.sh)"
    echo ""
    echo "Quick start:"
    echo "  make quick-start"
    exit 0
else
    print_error "Some critical prerequisites are missing or not configured properly."
    echo ""
    echo "Please address the issues above before proceeding."
    echo ""
    echo "Common fixes:"
    echo "  - Install Docker Desktop and start it"
    echo "  - Make sure Docker daemon is running"
    echo "  - Create missing configuration files"
    echo "  - Make scripts executable"
    exit 1
fi