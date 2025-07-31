#!/bin/bash

# Performance Monitoring Script for Case Management System
# This script runs various performance tests and generates reports

set -e

echo "⚡ Starting Performance Monitoring..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="${BACKEND_URL:-http://localhost:3001}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"
REPORT_DIR="reports/performance"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

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
    esac
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to wait for service
wait_for_service() {
    local url=$1
    local name=$2
    local timeout=${3:-30}
    
    print_status "info" "Waiting for $name to be ready..."
    
    for i in $(seq 1 $timeout); do
        if curl -s "$url/health" >/dev/null 2>&1 || curl -s "$url" >/dev/null 2>&1; then
            print_status "success" "$name is ready"
            return 0
        fi
        sleep 1
    done
    
    print_status "error" "$name is not responding after ${timeout}s"
    return 1
}

# 1. Health Check
print_status "info" "Performing health checks..."

if curl -s "$BACKEND_URL/health" >/dev/null 2>&1; then
    print_status "success" "Backend is healthy"
else
    print_status "error" "Backend is not responding"
    exit 1
fi

if curl -s "$FRONTEND_URL" >/dev/null 2>&1; then
    print_status "success" "Frontend is healthy"
else
    print_status "error" "Frontend is not responding"
    exit 1
fi

# 2. Basic Performance Metrics
print_status "info" "Collecting basic performance metrics..."

{
    echo "=== Basic Performance Metrics ==="
    echo "Timestamp: $(date)"
    echo "Backend URL: $BACKEND_URL"
    echo "Frontend URL: $FRONTEND_URL"
    echo ""
    
    # Response time test
    echo "Response Time Tests:"
    
    # Backend health endpoint
    backend_time=$(curl -w "%{time_total}" -s -o /dev/null "$BACKEND_URL/health")
    echo "Backend health: ${backend_time}s"
    
    # Frontend homepage
    frontend_time=$(curl -w "%{time_total}" -s -o /dev/null "$FRONTEND_URL")
    echo "Frontend homepage: ${frontend_time}s"
    
    echo ""
} > "$REPORT_DIR/basic_metrics_$TIMESTAMP.txt"

# 3. Lighthouse Performance Test (if available)
if command_exists lighthouse; then
    print_status "info" "Running Lighthouse performance test..."
    
    lighthouse_report="$REPORT_DIR/lighthouse_$TIMESTAMP.json"
    
    if lighthouse "$FRONTEND_URL" \
        --output=json \
        --output-path="$lighthouse_report" \
        --chrome-flags="--headless --no-sandbox" \
        --quiet; then
        
        print_status "success" "Lighthouse test completed"
        
        # Extract key metrics
        performance_score=$(jq -r '.categories.performance.score * 100' "$lighthouse_report" 2>/dev/null || echo "N/A")
        fcp=$(jq -r '.audits["first-contentful-paint"].numericValue' "$lighthouse_report" 2>/dev/null || echo "N/A")
        lcp=$(jq -r '.audits["largest-contentful-paint"].numericValue' "$lighthouse_report" 2>/dev/null || echo "N/A")
        
        echo "Performance Score: $performance_score/100" >> "$REPORT_DIR/basic_metrics_$TIMESTAMP.txt"
        echo "First Contentful Paint: ${fcp}ms" >> "$REPORT_DIR/basic_metrics_$TIMESTAMP.txt"
        echo "Largest Contentful Paint: ${lcp}ms" >> "$REPORT_DIR/basic_metrics_$TIMESTAMP.txt"
        
    else
        print_status "warning" "Lighthouse test failed"
    fi
else
    print_status "warning" "Lighthouse not available, skipping performance audit"
fi

# 4. Bundle Size Analysis
print_status "info" "Analyzing bundle sizes..."

{
    echo ""
    echo "=== Bundle Size Analysis ==="
    
    if [ -d "frontend/.next" ]; then
        echo "Next.js Build Analysis:"
        if [ -f "frontend/.next/analyze/bundle-packages.json" ]; then
            # Use existing bundle analysis if available
            echo "Bundle analysis found in frontend/.next/analyze/"
        else
            echo "No bundle analysis found. Run 'npm run build' first."
        fi
        
        # Check build output sizes
        if [ -d "frontend/.next" ]; then
            echo ""
            echo "Build Directory Sizes:"
            du -sh frontend/.next/static/* 2>/dev/null || echo "No static files found"
        fi
    fi
    
    if [ -d "backend/dist" ]; then
        echo ""
        echo "Backend Build Size:"
        du -sh backend/dist 2>/dev/null || echo "No backend build found"
    fi
    
} >> "$REPORT_DIR/basic_metrics_$TIMESTAMP.txt"

# 5. Memory and CPU Usage (if on Linux/macOS)
if command_exists ps && command_exists grep; then
    print_status "info" "Collecting system resource usage..."
    
    {
        echo ""
        echo "=== System Resource Usage ==="
        
        # Node.js processes
        echo "Node.js Processes:"
        ps aux | grep -E "(node|npm)" | grep -v grep || echo "No Node.js processes found"
        
        # Memory usage
        if command_exists free; then
            echo ""
            echo "Memory Usage:"
            free -h
        elif command_exists vm_stat; then
            echo ""
            echo "Memory Usage (macOS):"
            vm_stat
        fi
        
        # CPU usage
        if command_exists top; then
            echo ""
            echo "Top CPU Consumers:"
            top -l 1 -n 5 2>/dev/null | head -20 || echo "Could not get CPU usage"
        fi
        
    } >> "$REPORT_DIR/basic_metrics_$TIMESTAMP.txt"
fi

# 6. API Response Time Test
print_status "info" "Testing API response times..."

{
    echo ""
    echo "=== API Response Time Test ==="
    
    # Test common endpoints
    endpoints=(
        "/health"
        "/auth/login"
        "/cases"
    )
    
    for endpoint in "${endpoints[@]}"; do
        url="$BACKEND_URL$endpoint"
        
        if [ "$endpoint" = "/auth/login" ]; then
            # POST request for login
            response_time=$(curl -w "%{time_total}" -s -o /dev/null \
                -X POST \
                -H "Content-Type: application/json" \
                -d '{"email":"test@example.com","password":"test"}' \
                "$url" 2>/dev/null || echo "failed")
        else
            # GET request
            response_time=$(curl -w "%{time_total}" -s -o /dev/null "$url" 2>/dev/null || echo "failed")
        fi
        
        echo "$endpoint: ${response_time}s"
    done
    
} >> "$REPORT_DIR/basic_metrics_$TIMESTAMP.txt"

# 7. Load Test (if K6 is available)
if command_exists k6; then
    print_status "info" "Running light load test..."
    
    # Create a simple load test
    cat > "/tmp/simple_load_test.js" << 'EOF'
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  vus: 5, // 5 virtual users
  duration: '30s', // for 30 seconds
};

export default function() {
  const backend_url = __ENV.BACKEND_URL || 'http://localhost:3001';
  const response = http.get(`${backend_url}/health`);
  
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
EOF
    
    if k6 run --env BACKEND_URL="$BACKEND_URL" "/tmp/simple_load_test.js" > "$REPORT_DIR/load_test_$TIMESTAMP.txt" 2>&1; then
        print_status "success" "Load test completed"
    else
        print_status "warning" "Load test failed"
    fi
    
    # Cleanup
    rm -f "/tmp/simple_load_test.js"
else
    print_status "warning" "K6 not available, skipping load test"
fi

# 8. Generate Performance Report Summary
print_status "info" "Generating performance summary..."

{
    echo "================================="
    echo "PERFORMANCE MONITORING SUMMARY"
    echo "================================="
    echo "Date: $(date)"
    echo "Report Files Generated:"
    echo "- Basic Metrics: $REPORT_DIR/basic_metrics_$TIMESTAMP.txt"
    [ -f "$REPORT_DIR/lighthouse_$TIMESTAMP.json" ] && echo "- Lighthouse Report: $REPORT_DIR/lighthouse_$TIMESTAMP.json"
    [ -f "$REPORT_DIR/load_test_$TIMESTAMP.txt" ] && echo "- Load Test: $REPORT_DIR/load_test_$TIMESTAMP.txt"
    echo ""
    
    # Extract key findings
    echo "Key Performance Indicators:"
    
    # Backend response time
    backend_time=$(grep "Backend health:" "$REPORT_DIR/basic_metrics_$TIMESTAMP.txt" | cut -d: -f2 | tr -d ' s')
    if [ -n "$backend_time" ]; then
        echo "- Backend Response Time: ${backend_time}s"
        if (( $(echo "$backend_time > 1.0" | bc -l 2>/dev/null || echo 0) )); then
            echo "  ⚠️  Backend response time is slow (>1s)"
        fi
    fi
    
    # Frontend response time
    frontend_time=$(grep "Frontend homepage:" "$REPORT_DIR/basic_metrics_$TIMESTAMP.txt" | cut -d: -f2 | tr -d ' s')
    if [ -n "$frontend_time" ]; then
        echo "- Frontend Response Time: ${frontend_time}s"
        if (( $(echo "$frontend_time > 2.0" | bc -l 2>/dev/null || echo 0) )); then
            echo "  ⚠️  Frontend response time is slow (>2s)"
        fi
    fi
    
    # Lighthouse score (if available)
    if [ -f "$lighthouse_report" ]; then
        performance_score=$(grep "Performance Score:" "$REPORT_DIR/basic_metrics_$TIMESTAMP.txt" | cut -d: -f2 | tr -d ' ')
        if [ -n "$performance_score" ]; then
            echo "- Lighthouse Performance Score: $performance_score"
            score_num=$(echo "$performance_score" | cut -d/ -f1)
            if [ "$score_num" -lt 80 ]; then
                echo "  ⚠️  Performance score is below 80"
            fi
        fi
    fi
    
    echo ""
    echo "Recommendations:"
    echo "- Review all generated reports for detailed analysis"
    echo "- Monitor trends over time"
    echo "- Set up regular performance monitoring"
    echo "- Consider implementing performance budgets"
    echo "================================="
    
} > "$REPORT_DIR/performance_summary_$TIMESTAMP.txt"

print_status "success" "Performance monitoring completed!"
print_status "info" "Reports saved in $REPORT_DIR/"

echo ""
echo "📊 Performance Summary:"
cat "$REPORT_DIR/performance_summary_$TIMESTAMP.txt"

# Check for performance issues
issues_found=false

# Check backend response time
if [ -n "$backend_time" ] && (( $(echo "$backend_time > 1.0" | bc -l 2>/dev/null || echo 0) )); then
    issues_found=true
fi

# Check frontend response time
if [ -n "$frontend_time" ] && (( $(echo "$frontend_time > 2.0" | bc -l 2>/dev/null || echo 0) )); then
    issues_found=true
fi

if [ "$issues_found" = true ]; then
    print_status "warning" "Performance issues detected - review reports for details"
    exit 1
else
    print_status "success" "No critical performance issues detected"
    exit 0
fi