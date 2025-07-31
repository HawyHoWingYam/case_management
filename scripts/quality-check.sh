#!/bin/bash

# Quality Check Script for Case Management System
# This script runs comprehensive quality checks across the entire project

set -e

echo "🎯 Starting Comprehensive Quality Check..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
REPORT_DIR="reports/quality"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
QUALITY_REPORT="$REPORT_DIR/quality_report_$TIMESTAMP.md"

# Create reports directory
mkdir -p "$REPORT_DIR"

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
            echo -e "${BLUE}ℹ️  $message${NC}"
            ;;
        "header")
            echo -e "${PURPLE}🔍 $message${NC}"
            ;;
    esac
}

# Function to run command and capture output
run_check() {
    local name=$1
    local command=$2
    local description=$3
    
    print_status "info" "Running $name..."
    
    if eval "$command" > "/tmp/${name}_output.txt" 2>&1; then
        print_status "success" "$description passed"
        echo "✅ **$description** - PASSED" >> "$QUALITY_REPORT"
        return 0
    else
        print_status "error" "$description failed"
        echo "❌ **$description** - FAILED" >> "$QUALITY_REPORT"
        echo '```' >> "$QUALITY_REPORT"
        cat "/tmp/${name}_output.txt" >> "$QUALITY_REPORT"
        echo '```' >> "$QUALITY_REPORT"
        echo "" >> "$QUALITY_REPORT"
        return 1
    fi
}

# Initialize quality report
{
    echo "# Quality Check Report"
    echo "**Generated:** $(date)"
    echo "**Project:** Case Management System"
    echo ""
    echo "## Overview"
    echo ""
} > "$QUALITY_REPORT"

# Track overall results
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# 1. Code Style and Formatting
print_status "header" "Code Style and Formatting Checks"
echo "## 1. Code Style and Formatting" >> "$QUALITY_REPORT"
echo "" >> "$QUALITY_REPORT"

# ESLint Frontend
if run_check "eslint_frontend" "cd frontend && npm run lint" "Frontend ESLint"; then
    ((PASSED_CHECKS++))
else
    ((FAILED_CHECKS++))
fi
((TOTAL_CHECKS++))

# ESLint Backend  
if run_check "eslint_backend" "cd backend && npm run lint:check" "Backend ESLint"; then
    ((PASSED_CHECKS++))
else
    ((FAILED_CHECKS++))
fi
((TOTAL_CHECKS++))

# Prettier Frontend
if run_check "prettier_frontend" "cd frontend && npm run format:check" "Frontend Prettier"; then
    ((PASSED_CHECKS++))
else
    ((FAILED_CHECKS++))
fi
((TOTAL_CHECKS++))

# Prettier Backend
if run_check "prettier_backend" "cd backend && npm run format:check" "Backend Prettier"; then
    ((PASSED_CHECKS++))
else
    ((FAILED_CHECKS++))
fi
((TOTAL_CHECKS++))

echo "" >> "$QUALITY_REPORT"

# 2. Type Checking
print_status "header" "TypeScript Type Checking"
echo "## 2. TypeScript Type Checking" >> "$QUALITY_REPORT"
echo "" >> "$QUALITY_REPORT"

# TypeScript Frontend
if run_check "typescript_frontend" "cd frontend && npm run type-check" "Frontend TypeScript"; then
    ((PASSED_CHECKS++))
else
    ((FAILED_CHECKS++))
fi
((TOTAL_CHECKS++))

# TypeScript Backend
if run_check "typescript_backend" "cd backend && npm run type-check" "Backend TypeScript"; then
    ((PASSED_CHECKS++))
else
    ((FAILED_CHECKS++))
fi
((TOTAL_CHECKS++))

echo "" >> "$QUALITY_REPORT"

# 3. Unit Tests
print_status "header" "Unit Tests"
echo "## 3. Unit Tests" >> "$QUALITY_REPORT"
echo "" >> "$QUALITY_REPORT"

# Frontend Tests
if run_check "tests_frontend" "cd frontend && npm run test:ci" "Frontend Unit Tests"; then
    ((PASSED_CHECKS++))
else
    ((FAILED_CHECKS++))
fi
((TOTAL_CHECKS++))

# Backend Tests
if run_check "tests_backend" "cd backend && npm run test:unit" "Backend Unit Tests"; then
    ((PASSED_CHECKS++))
else
    ((FAILED_CHECKS++))
fi
((TOTAL_CHECKS++))

echo "" >> "$QUALITY_REPORT"

# 4. Build Tests
print_status "header" "Build Tests"
echo "## 4. Build Tests" >> "$QUALITY_REPORT"
echo "" >> "$QUALITY_REPORT"

# Frontend Build
if run_check "build_frontend" "cd frontend && npm run build" "Frontend Build"; then
    ((PASSED_CHECKS++))
else
    ((FAILED_CHECKS++))
fi
((TOTAL_CHECKS++))

# Backend Build
if run_check "build_backend" "cd backend && npm run build" "Backend Build"; then
    ((PASSED_CHECKS++))
else
    ((FAILED_CHECKS++))
fi
((TOTAL_CHECKS++))

echo "" >> "$QUALITY_REPORT"

# 5. Security Checks
print_status "header" "Security Checks"
echo "## 5. Security Checks" >> "$QUALITY_REPORT"
echo "" >> "$QUALITY_REPORT"

# NPM Audit Frontend
if run_check "audit_frontend" "cd frontend && npm audit --audit-level moderate" "Frontend Security Audit"; then
    ((PASSED_CHECKS++))
else
    ((FAILED_CHECKS++))
fi
((TOTAL_CHECKS++))

# NPM Audit Backend
if run_check "audit_backend" "cd backend && npm audit --audit-level moderate" "Backend Security Audit"; then
    ((PASSED_CHECKS++))
else
    ((FAILED_CHECKS++))
fi
((TOTAL_CHECKS++))

echo "" >> "$QUALITY_REPORT"

# 6. Code Quality Metrics
print_status "header" "Code Quality Metrics"
echo "## 6. Code Quality Metrics" >> "$QUALITY_REPORT"
echo "" >> "$QUALITY_REPORT"

# Coverage Report
if [ -d "frontend/coverage" ] && [ -d "backend/coverage" ]; then
    print_status "info" "Generating coverage summary..."
    
    # Frontend Coverage
    if [ -f "frontend/coverage/coverage-summary.json" ]; then
        FRONTEND_COVERAGE=$(node -e "
            const coverage = require('./frontend/coverage/coverage-summary.json');
            const lines = coverage.total.lines.pct;
            const branches = coverage.total.branches.pct;
            const functions = coverage.total.functions.pct;
            const statements = coverage.total.statements.pct;
            console.log(\`Lines: \${lines}%, Branches: \${branches}%, Functions: \${functions}%, Statements: \${statements}%\`);
        ")
        echo "**Frontend Coverage:** $FRONTEND_COVERAGE" >> "$QUALITY_REPORT"
        
        # Check if coverage meets threshold
        FRONTEND_LINES_PCT=$(node -e "console.log(require('./frontend/coverage/coverage-summary.json').total.lines.pct)")
        if (( $(echo "$FRONTEND_LINES_PCT >= 90" | bc -l) )); then
            print_status "success" "Frontend coverage meets 90% threshold ($FRONTEND_LINES_PCT%)"
            ((PASSED_CHECKS++))
        else
            print_status "warning" "Frontend coverage below 90% threshold ($FRONTEND_LINES_PCT%)"
            ((FAILED_CHECKS++))
        fi
        ((TOTAL_CHECKS++))
    fi
    
    # Backend Coverage
    if [ -f "backend/coverage/coverage-summary.json" ]; then
        BACKEND_COVERAGE=$(node -e "
            const coverage = require('./backend/coverage/coverage-summary.json');
            const lines = coverage.total.lines.pct;
            const branches = coverage.total.branches.pct;
            const functions = coverage.total.functions.pct;
            const statements = coverage.total.statements.pct;
            console.log(\`Lines: \${lines}%, Branches: \${branches}%, Functions: \${functions}%, Statements: \${statements}%\`);
        ")
        echo "**Backend Coverage:** $BACKEND_COVERAGE" >> "$QUALITY_REPORT"
        
        # Check if coverage meets threshold
        BACKEND_LINES_PCT=$(node -e "console.log(require('./backend/coverage/coverage-summary.json').total.lines.pct)")
        if (( $(echo "$BACKEND_LINES_PCT >= 90" | bc -l) )); then
            print_status "success" "Backend coverage meets 90% threshold ($BACKEND_LINES_PCT%)"
            ((PASSED_CHECKS++))
        else
            print_status "warning" "Backend coverage below 90% threshold ($BACKEND_LINES_PCT%)"
            ((FAILED_CHECKS++))
        fi
        ((TOTAL_CHECKS++))
    fi
else
    print_status "warning" "Coverage reports not found. Run tests first to generate coverage."
    echo "⚠️ Coverage reports not found" >> "$QUALITY_REPORT"
fi

echo "" >> "$QUALITY_REPORT"

# 7. Documentation Checks
print_status "header" "Documentation Checks"
echo "## 7. Documentation" >> "$QUALITY_REPORT"
echo "" >> "$QUALITY_REPORT"

# Check for required documentation files
REQUIRED_DOCS=(
    "README.md"
    "docs/DEVELOPER_GUIDE.md"
    "docs/QUALITY_STANDARDS.md"
    "docs/STYLE_GUIDE.md"
)

for doc in "${REQUIRED_DOCS[@]}"; do
    if [ -f "$doc" ]; then
        print_status "success" "$doc exists"
        echo "✅ $doc - EXISTS" >> "$QUALITY_REPORT"
        ((PASSED_CHECKS++))
    else
        print_status "error" "$doc missing"
        echo "❌ $doc - MISSING" >> "$QUALITY_REPORT"
        ((FAILED_CHECKS++))
    fi
    ((TOTAL_CHECKS++))
done

echo "" >> "$QUALITY_REPORT"

# 8. Git Hooks Check
print_status "header" "Git Hooks Configuration"
echo "## 8. Git Hooks" >> "$QUALITY_REPORT"
echo "" >> "$QUALITY_REPORT"

if [ -f ".husky/pre-commit" ] && [ -x ".husky/pre-commit" ]; then
    print_status "success" "Pre-commit hook configured"
    echo "✅ Pre-commit hook - CONFIGURED" >> "$QUALITY_REPORT"
    ((PASSED_CHECKS++))
else
    print_status "error" "Pre-commit hook missing or not executable"
    echo "❌ Pre-commit hook - MISSING" >> "$QUALITY_REPORT"
    ((FAILED_CHECKS++))
fi
((TOTAL_CHECKS++))

if [ -f ".husky/pre-push" ] && [ -x ".husky/pre-push" ]; then
    print_status "success" "Pre-push hook configured"
    echo "✅ Pre-push hook - CONFIGURED" >> "$QUALITY_REPORT"
    ((PASSED_CHECKS++))
else
    print_status "error" "Pre-push hook missing or not executable"
    echo "❌ Pre-push hook - MISSING" >> "$QUALITY_REPORT"
    ((FAILED_CHECKS++))
fi
((TOTAL_CHECKS++))

echo "" >> "$QUALITY_REPORT"

# 9. Environment Configuration
print_status "header" "Environment Configuration"
echo "## 9. Environment Configuration" >> "$QUALITY_REPORT"
echo "" >> "$QUALITY_REPORT"

# Check for environment example files
ENV_FILES=(
    ".env.example"
    "backend/.env.example"
    "frontend/.env.example"
)

for env_file in "${ENV_FILES[@]}"; do
    if [ -f "$env_file" ]; then
        print_status "success" "$env_file exists"
        echo "✅ $env_file - EXISTS" >> "$QUALITY_REPORT"
        ((PASSED_CHECKS++))
    else
        print_status "warning" "$env_file missing"
        echo "⚠️ $env_file - MISSING" >> "$QUALITY_REPORT"
        ((FAILED_CHECKS++))
    fi
    ((TOTAL_CHECKS++))
done

echo "" >> "$QUALITY_REPORT"

# Generate Final Summary
print_status "header" "Generating Quality Summary"

PASS_RATE=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))

{
    echo "## Summary"
    echo ""
    echo "**Total Checks:** $TOTAL_CHECKS"
    echo "**Passed:** $PASSED_CHECKS"
    echo "**Failed:** $FAILED_CHECKS"
    echo "**Pass Rate:** $PASS_RATE%"
    echo ""
    
    if [ $PASS_RATE -ge 90 ]; then
        echo "🎉 **EXCELLENT** - Quality standards exceeded!"
    elif [ $PASS_RATE -ge 80 ]; then
        echo "✅ **GOOD** - Quality standards met with room for improvement"
    elif [ $PASS_RATE -ge 70 ]; then
        echo "⚠️ **FAIR** - Some quality issues need attention"
    else
        echo "❌ **POOR** - Significant quality issues require immediate attention"
    fi
    
    echo ""
    echo "## Recommendations"
    echo ""
    
    if [ $FAILED_CHECKS -gt 0 ]; then
        echo "1. Review and fix all failed checks listed above"
        echo "2. Ensure all tests pass before committing code"
        echo "3. Run this quality check script regularly during development"
        echo "4. Consider setting up automated quality gates in CI/CD"
    else
        echo "🎊 All quality checks passed! Great work!"
        echo "1. Continue maintaining these high standards"
        echo "2. Consider increasing test coverage even further"
        echo "3. Keep documentation up to date as the project evolves"
    fi
    
    echo ""
    echo "---"
    echo "*Report generated by quality-check.sh on $(date)*"
    
} >> "$QUALITY_REPORT"

# Display final results
echo ""
echo "======================================"
print_status "header" "QUALITY CHECK SUMMARY"
echo "======================================"
echo ""
print_status "info" "Total Checks: $TOTAL_CHECKS"
print_status "success" "Passed: $PASSED_CHECKS"
print_status "error" "Failed: $FAILED_CHECKS"
print_status "info" "Pass Rate: $PASS_RATE%"
echo ""

if [ $PASS_RATE -ge 90 ]; then
    print_status "success" "EXCELLENT - Quality standards exceeded!"
elif [ $PASS_RATE -ge 80 ]; then
    print_status "success" "GOOD - Quality standards met"
elif [ $PASS_RATE -ge 70 ]; then
    print_status "warning" "FAIR - Some quality issues need attention"
else
    print_status "error" "POOR - Significant quality issues require immediate attention"
fi

echo ""
print_status "info" "Detailed report saved to: $QUALITY_REPORT"

# Cleanup temporary files
rm -f /tmp/*_output.txt

# Exit with appropriate code
if [ $FAILED_CHECKS -gt 0 ]; then
    exit 1
else
    exit 0
fi