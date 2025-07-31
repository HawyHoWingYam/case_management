#!/bin/bash

# Security Scan Script for Case Management System
# This script runs various security checks locally

set -e

echo "🔒 Starting Security Scan..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create reports directory
mkdir -p reports/security

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to print status
print_status() {
    local status=$1
    local message=$2
    case $status in
        "success")
            echo -e "${GREEN}✅ $message${NC}"
            ;;
        "warning")
            echo -e "${YELLOW}⚠️  $message${NC}"
            ;;
        "error")
            echo -e "${RED}❌ $message${NC}"
            ;;
        "info")
            echo -e "ℹ️  $message"
            ;;
    esac
}

# 1. NPM Audit
print_status "info" "Running npm audit..."
echo "=== NPM Audit Report ===" > reports/security/npm-audit.txt

if npm audit --audit-level moderate >> reports/security/npm-audit.txt 2>&1; then
    print_status "success" "Root dependencies audit passed"
else
    print_status "warning" "Root dependencies have vulnerabilities"
fi

cd backend
if npm audit --audit-level moderate >> ../reports/security/npm-audit.txt 2>&1; then
    print_status "success" "Backend dependencies audit passed"
else
    print_status "warning" "Backend dependencies have vulnerabilities"
fi
cd ..

cd frontend
if npm audit --audit-level moderate >> ../reports/security/npm-audit.txt 2>&1; then
    print_status "success" "Frontend dependencies audit passed"
else
    print_status "warning" "Frontend dependencies have vulnerabilities"
fi
cd ..

# 2. Secret Detection
print_status "info" "Scanning for secrets..."
echo "=== Secret Scan Report ===" > reports/security/secret-scan.txt

# Check for common secret patterns
if command_exists grep; then
    # Look for potential secrets in code
    if grep -r -i -n \
        -e "password\s*=\s*['\"][^'\"]*['\"]" \
        -e "secret\s*=\s*['\"][^'\"]*['\"]" \
        -e "key\s*=\s*['\"][^'\"]*['\"]" \
        -e "token\s*=\s*['\"][^'\"]*['\"]" \
        -e "api_key\s*=\s*['\"][^'\"]*['\"]" \
        --include="*.ts" --include="*.js" --include="*.json" \
        --exclude-dir=node_modules --exclude-dir=.git \
        . >> reports/security/secret-scan.txt 2>&1; then
        print_status "warning" "Potential secrets found in code"
    else
        print_status "success" "No obvious secrets found in code"
    fi
fi

# 3. File Permission Check
print_status "info" "Checking file permissions..."
echo "=== File Permission Report ===" > reports/security/permissions.txt

# Check for overly permissive files
find . -type f -perm -o+w -not -path "./node_modules/*" -not -path "./.git/*" >> reports/security/permissions.txt 2>&1
if [ -s reports/security/permissions.txt ]; then
    print_status "warning" "World-writable files found"
else
    print_status "success" "File permissions look good"
fi

# 4. Configuration Security Check
print_status "info" "Checking configuration security..."
echo "=== Configuration Security Report ===" > reports/security/config-check.txt

# Check for insecure configurations
security_issues=0

# Check for .env files (should only be .env.example)
if find . -name ".env" -not -name ".env.example" -not -path "./node_modules/*" | grep -q .; then
    echo "ISSUE: .env files found (potential secret exposure)" >> reports/security/config-check.txt
    ((security_issues++))
fi

# Check for default ports in production configs
if grep -r "3000\|3001" --include="*.json" --include="*.js" --include="*.ts" \
   --exclude-dir=node_modules --exclude-dir=.git . | grep -v -E "(test|dev|local)" >> reports/security/config-check.txt 2>&1; then
    echo "WARNING: Default ports found in configuration" >> reports/security/config-check.txt
fi

# Check Docker configurations
if find . -name "Dockerfile*" -exec grep -l "FROM.*:latest" {} \; >> reports/security/config-check.txt 2>&1; then
    echo "WARNING: Docker images using 'latest' tag" >> reports/security/config-check.txt
fi

if [ $security_issues -eq 0 ]; then
    print_status "success" "Configuration security checks passed"
else
    print_status "warning" "Configuration security issues found"
fi

# 5. Dependency License Check
print_status "info" "Checking dependency licenses..."
echo "=== License Report ===" > reports/security/licenses.txt

# Check for problematic licenses
problematic_licenses=("GPL-3.0" "AGPL-3.0" "LGPL-3.0")
license_issues=0

for dir in "backend" "frontend"; do
    if [ -d "$dir" ]; then
        cd "$dir"
        echo "Checking $dir licenses..." >> ../reports/security/licenses.txt
        
        if command_exists npm; then
            # Check licenses using npm ls
            npm ls --depth=0 --parseable 2>/dev/null | while read package; do
                if [ -f "$package/package.json" ]; then
                    license=$(grep -o '"license":\s*"[^"]*"' "$package/package.json" 2>/dev/null | cut -d'"' -f4)
                    if [ -n "$license" ]; then
                        for problematic in "${problematic_licenses[@]}"; do
                            if [ "$license" = "$problematic" ]; then
                                echo "ISSUE: $package uses problematic license: $license" >> ../reports/security/licenses.txt
                                ((license_issues++))
                            fi
                        done
                    fi
                fi
            done
        fi
        cd ..
    fi
done

if [ $license_issues -eq 0 ]; then
    print_status "success" "License checks passed"
else
    print_status "warning" "Problematic licenses found"
fi

# 6. HTTPS and Security Headers Check (if URLs are provided)
if [ -n "$1" ]; then
    print_status "info" "Checking security headers for $1..."
    echo "=== Security Headers Report ===" > reports/security/headers.txt
    
    if command_exists curl; then
        # Check security headers
        headers=$(curl -s -I "$1" 2>/dev/null || echo "Failed to fetch headers")
        echo "$headers" > reports/security/headers.txt
        
        # Check for important security headers
        if echo "$headers" | grep -qi "strict-transport-security"; then
            print_status "success" "HSTS header present"
        else
            print_status "warning" "HSTS header missing"
        fi
        
        if echo "$headers" | grep -qi "x-content-type-options"; then
            print_status "success" "X-Content-Type-Options header present"
        else
            print_status "warning" "X-Content-Type-Options header missing"
        fi
        
        if echo "$headers" | grep -qi "x-frame-options"; then
            print_status "success" "X-Frame-Options header present"
        else
            print_status "warning" "X-Frame-Options header missing"
        fi
    fi
fi

# Generate summary report
print_status "info" "Generating security summary..."
{
    echo "============================="
    echo "SECURITY SCAN SUMMARY REPORT"
    echo "============================="
    echo "Date: $(date)"
    echo ""
    echo "Files scanned:"
    echo "- NPM Audit: reports/security/npm-audit.txt"
    echo "- Secret Scan: reports/security/secret-scan.txt"
    echo "- File Permissions: reports/security/permissions.txt"
    echo "- Configuration: reports/security/config-check.txt"
    echo "- Licenses: reports/security/licenses.txt"
    [ -f "reports/security/headers.txt" ] && echo "- Security Headers: reports/security/headers.txt"
    echo ""
    echo "Review all report files for detailed findings."
    echo "============================="
} > reports/security/summary.txt

print_status "success" "Security scan completed!"
print_status "info" "Reports saved in reports/security/"

echo ""
echo "📋 Summary Report:"
cat reports/security/summary.txt

# Exit with non-zero if critical issues found
if grep -q "ISSUE:" reports/security/*.txt 2>/dev/null; then
    print_status "error" "Critical security issues found!"
    exit 1
else
    print_status "success" "No critical security issues detected"
    exit 0
fi