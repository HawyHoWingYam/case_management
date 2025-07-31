#!/bin/bash

# Coverage Report Generator
# Generates a comprehensive coverage report combining all test types

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
COVERAGE_DIR="./coverage"
THRESHOLD_LINES=90
THRESHOLD_FUNCTIONS=90
THRESHOLD_BRANCHES=85
THRESHOLD_STATEMENTS=90

print_header() {
    echo -e "${BLUE}"
    echo "================================================"
    echo "    Coverage Report Generator                   "
    echo "================================================"
    echo -e "${NC}"
}

extract_coverage_metrics() {
    local lcov_file="$1"
    local component="$2"
    
    if [ -f "$lcov_file" ]; then
        # Extract metrics from lcov file
        local lines_found=$(grep -o "LF:[0-9]*" "$lcov_file" | tail -1 | cut -d: -f2)
        local lines_hit=$(grep -o "LH:[0-9]*" "$lcov_file" | tail -1 | cut -d: -f2)
        local functions_found=$(grep -o "FNF:[0-9]*" "$lcov_file" | tail -1 | cut -d: -f2)
        local functions_hit=$(grep -o "FNH:[0-9]*" "$lcov_file" | tail -1 | cut -d: -f2)
        local branches_found=$(grep -o "BRF:[0-9]*" "$lcov_file" | tail -1 | cut -d: -f2)
        local branches_hit=$(grep -o "BRH:[0-9]*" "$lcov_file" | tail -1 | cut -d: -f2)
        
        # Calculate percentages
        local lines_pct=0
        local functions_pct=0
        local branches_pct=0
        
        if [ "$lines_found" -gt 0 ]; then
            lines_pct=$(( (lines_hit * 100) / lines_found ))
        fi
        
        if [ "$functions_found" -gt 0 ]; then
            functions_pct=$(( (functions_hit * 100) / functions_found ))
        fi
        
        if [ "$branches_found" -gt 0 ]; then
            branches_pct=$(( (branches_hit * 100) / branches_found ))
        fi
        
        echo "$component,$lines_pct,$functions_pct,$branches_pct,$lines_pct"
    else
        echo "$component,0,0,0,0"
    fi
}

get_coverage_status() {
    local percentage=$1
    local threshold=$2
    
    if [ "$percentage" -ge "$threshold" ]; then
        echo "PASS"
    else
        echo "FAIL"
    fi
}

get_coverage_color() {
    local percentage=$1
    local threshold=$2
    
    if [ "$percentage" -ge "$threshold" ]; then
        echo "${GREEN}"
    else
        echo "${RED}"
    fi
}

generate_text_report() {
    echo -e "\n${BLUE}=== Coverage Summary ===${NC}"
    
    # Header
    printf "%-20s %-10s %-12s %-10s %-12s %-8s\n" "Component" "Lines" "Functions" "Branches" "Statements" "Status"
    printf "%-20s %-10s %-12s %-10s %-12s %-8s\n" "--------" "-----" "---------" "--------" "----------" "------"
    
    # Backend coverage
    local backend_metrics=$(extract_coverage_metrics "backend/coverage/lcov.info" "Backend")
    IFS=',' read -r component lines_pct functions_pct branches_pct statements_pct <<< "$backend_metrics"
    
    local lines_status=$(get_coverage_status $lines_pct $THRESHOLD_LINES)
    local functions_status=$(get_coverage_status $functions_pct $THRESHOLD_FUNCTIONS)
    local branches_status=$(get_coverage_status $branches_pct $THRESHOLD_BRANCHES)
    local statements_status=$(get_coverage_status $statements_pct $THRESHOLD_STATEMENTS)
    
    local lines_color=$(get_coverage_color $lines_pct $THRESHOLD_LINES)
    local functions_color=$(get_coverage_color $functions_pct $THRESHOLD_FUNCTIONS)
    local branches_color=$(get_coverage_color $branches_pct $THRESHOLD_BRANCHES)
    local statements_color=$(get_coverage_color $statements_pct $THRESHOLD_STATEMENTS)
    
    printf "%-20s ${lines_color}%-10s${NC} ${functions_color}%-12s${NC} ${branches_color}%-10s${NC} ${statements_color}%-12s${NC} " \
        "$component" "${lines_pct}%" "${functions_pct}%" "${branches_pct}%" "${statements_pct}%"
    
    if [[ "$lines_status" == "PASS" && "$functions_status" == "PASS" && "$branches_status" == "PASS" && "$statements_status" == "PASS" ]]; then
        echo -e "${GREEN}PASS${NC}"
    else
        echo -e "${RED}FAIL${NC}"
    fi
    
    # Frontend coverage
    local frontend_metrics=$(extract_coverage_metrics "frontend/coverage/lcov.info" "Frontend")
    IFS=',' read -r component lines_pct functions_pct branches_pct statements_pct <<< "$frontend_metrics"
    
    local lines_status=$(get_coverage_status $lines_pct $THRESHOLD_LINES)
    local functions_status=$(get_coverage_status $functions_pct $THRESHOLD_FUNCTIONS)
    local branches_status=$(get_coverage_status $branches_pct $THRESHOLD_BRANCHES)
    local statements_status=$(get_coverage_status $statements_pct $THRESHOLD_STATEMENTS)
    
    local lines_color=$(get_coverage_color $lines_pct $THRESHOLD_LINES)
    local functions_color=$(get_coverage_color $functions_pct $THRESHOLD_FUNCTIONS)
    local branches_color=$(get_coverage_color $branches_pct $THRESHOLD_BRANCHES)
    local statements_color=$(get_coverage_color $statements_pct $THRESHOLD_STATEMENTS)
    
    printf "%-20s ${lines_color}%-10s${NC} ${functions_color}%-12s${NC} ${branches_color}%-10s${NC} ${statements_color}%-12s${NC} " \
        "$component" "${lines_pct}%" "${functions_pct}%" "${branches_pct}%" "${statements_pct}%"
    
    if [[ "$lines_status" == "PASS" && "$functions_status" == "PASS" && "$branches_status" == "PASS" && "$statements_status" == "PASS" ]]; then
        echo -e "${GREEN}PASS${NC}"
    else
        echo -e "${RED}FAIL${NC}"
    fi
    
    echo ""
    echo "Thresholds: Lines: ${THRESHOLD_LINES}%, Functions: ${THRESHOLD_FUNCTIONS}%, Branches: ${THRESHOLD_BRANCHES}%, Statements: ${THRESHOLD_STATEMENTS}%"
}

generate_html_report() {
    local html_file="$COVERAGE_DIR/combined-report.html"
    
    mkdir -p "$COVERAGE_DIR"
    
    # Extract metrics
    local backend_metrics=$(extract_coverage_metrics "backend/coverage/lcov.info" "Backend")
    local frontend_metrics=$(extract_coverage_metrics "frontend/coverage/lcov.info" "Frontend")
    
    IFS=',' read -r b_component b_lines b_functions b_branches b_statements <<< "$backend_metrics"
    IFS=',' read -r f_component f_lines f_functions f_branches f_statements <<< "$frontend_metrics"
    
    cat > "$html_file" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Case Management System - Coverage Report</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 2.5em;
            font-weight: 300;
        }
        .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
        }
        .summary {
            padding: 30px;
        }
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .metric-card {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            border-left: 4px solid #007bff;
        }
        .metric-card.pass {
            border-left-color: #28a745;
        }
        .metric-card.fail {
            border-left-color: #dc3545;
        }
        .metric-value {
            font-size: 2.5em;
            font-weight: bold;
            color: #333;
        }
        .metric-label {
            color: #666;
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .coverage-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .coverage-table th {
            background: #343a40;
            color: white;
            padding: 15px;
            text-align: left;
            font-weight: 500;
        }
        .coverage-table td {
            padding: 15px;
            border-bottom: 1px solid #dee2e6;
        }
        .coverage-table tr:hover {
            background-color: #f8f9fa;
        }
        .progress-bar {
            width: 100%;
            height: 20px;
            background-color: #e9ecef;
            border-radius: 10px;
            overflow: hidden;
            margin: 5px 0;
        }
        .progress-fill {
            height: 100%;
            border-radius: 10px;
            transition: width 0.3s ease;
        }
        .progress-high { background-color: #28a745; }
        .progress-medium { background-color: #ffc107; }
        .progress-low { background-color: #dc3545; }
        .links {
            background: #f8f9fa;
            padding: 30px;
            border-top: 1px solid #dee2e6;
        }
        .links h2 {
            margin-top: 0;
            color: #333;
        }
        .link-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        .link-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            text-decoration: none;
            color: #333;
            transition: transform 0.2s ease;
        }
        .link-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(0,0,0,0.15);
        }
        .timestamp {
            text-align: center;
            color: #666;
            padding: 20px;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Coverage Report</h1>
            <p>Case Management System - Generated on $(date)</p>
        </div>
        
        <div class="summary">
            <h2>Overall Coverage</h2>
            <div class="metrics-grid">
                <div class="metric-card $([ $(( (b_lines + f_lines) / 2 )) -ge $THRESHOLD_LINES ] && echo "pass" || echo "fail")">
                    <div class="metric-value">$(( (b_lines + f_lines) / 2 ))%</div>
                    <div class="metric-label">Lines</div>
                </div>
                <div class="metric-card $([ $(( (b_functions + f_functions) / 2 )) -ge $THRESHOLD_FUNCTIONS ] && echo "pass" || echo "fail")">
                    <div class="metric-value">$(( (b_functions + f_functions) / 2 ))%</div>
                    <div class="metric-label">Functions</div>
                </div>
                <div class="metric-card $([ $(( (b_branches + f_branches) / 2 )) -ge $THRESHOLD_BRANCHES ] && echo "pass" || echo "fail")">
                    <div class="metric-value">$(( (b_branches + f_branches) / 2 ))%</div>
                    <div class="metric-label">Branches</div>
                </div>
                <div class="metric-card $([ $(( (b_statements + f_statements) / 2 )) -ge $THRESHOLD_STATEMENTS ] && echo "pass" || echo "fail")">
                    <div class="metric-value">$(( (b_statements + f_statements) / 2 ))%</div>
                    <div class="metric-label">Statements</div>
                </div>
            </div>
            
            <h2>Component Breakdown</h2>
            <table class="coverage-table">
                <thead>
                    <tr>
                        <th>Component</th>
                        <th>Lines</th>
                        <th>Functions</th>
                        <th>Branches</th>
                        <th>Statements</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>Backend</strong></td>
                        <td>
                            <div>${b_lines}%</div>
                            <div class="progress-bar">
                                <div class="progress-fill $([ $b_lines -ge $THRESHOLD_LINES ] && echo "progress-high" || echo "progress-low")" style="width: ${b_lines}%"></div>
                            </div>
                        </td>
                        <td>
                            <div>${b_functions}%</div>
                            <div class="progress-bar">
                                <div class="progress-fill $([ $b_functions -ge $THRESHOLD_FUNCTIONS ] && echo "progress-high" || echo "progress-low")" style="width: ${b_functions}%"></div>
                            </div>
                        </td>
                        <td>
                            <div>${b_branches}%</div>
                            <div class="progress-bar">
                                <div class="progress-fill $([ $b_branches -ge $THRESHOLD_BRANCHES ] && echo "progress-high" || echo "progress-low")" style="width: ${b_branches}%"></div>
                            </div>
                        </td>
                        <td>
                            <div>${b_statements}%</div>
                            <div class="progress-bar">
                                <div class="progress-fill $([ $b_statements -ge $THRESHOLD_STATEMENTS ] && echo "progress-high" || echo "progress-low")" style="width: ${b_statements}%"></div>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td><strong>Frontend</strong></td>
                        <td>
                            <div>${f_lines}%</div>
                            <div class="progress-bar">
                                <div class="progress-fill $([ $f_lines -ge $THRESHOLD_LINES ] && echo "progress-high" || echo "progress-low")" style="width: ${f_lines}%"></div>
                            </div>
                        </td>
                        <td>
                            <div>${f_functions}%</div>
                            <div class="progress-bar">
                                <div class="progress-fill $([ $f_functions -ge $THRESHOLD_FUNCTIONS ] && echo "progress-high" || echo "progress-low")" style="width: ${f_functions}%"></div>
                            </div>
                        </td>
                        <td>
                            <div>${f_branches}%</div>
                            <div class="progress-bar">
                                <div class="progress-fill $([ $f_branches -ge $THRESHOLD_BRANCHES ] && echo "progress-high" || echo "progress-low")" style="width: ${f_branches}%"></div>
                            </div>
                        </td>
                        <td>
                            <div>${f_statements}%</div>
                            <div class="progress-bar">
                                <div class="progress-fill $([ $f_statements -ge $THRESHOLD_STATEMENTS ] && echo "progress-high" || echo "progress-low")" style="width: ${f_statements}%"></div>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        
        <div class="links">
            <h2>Detailed Reports</h2>
            <div class="link-grid">
                <a href="backend/index.html" class="link-card">
                    <h3>Backend Coverage</h3>
                    <p>Detailed coverage report for backend services and APIs</p>
                </a>
                <a href="frontend/index.html" class="link-card">
                    <h3>Frontend Coverage</h3>
                    <p>Detailed coverage report for frontend components and hooks</p>
                </a>
            </div>
        </div>
        
        <div class="timestamp">
            Report generated by Case Management System Test Suite
        </div>
    </div>
</body>
</html>
EOF
    
    echo "HTML coverage report generated: $html_file"
}

generate_json_report() {
    local json_file="$COVERAGE_DIR/coverage-summary.json"
    local backend_metrics=$(extract_coverage_metrics "backend/coverage/lcov.info" "Backend")
    local frontend_metrics=$(extract_coverage_metrics "frontend/coverage/lcov.info" "Frontend")
    
    IFS=',' read -r b_component b_lines b_functions b_branches b_statements <<< "$backend_metrics"
    IFS=',' read -r f_component f_lines f_functions f_branches f_statements <<< "$frontend_metrics"
    
    cat > "$json_file" << EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "thresholds": {
    "lines": $THRESHOLD_LINES,
    "functions": $THRESHOLD_FUNCTIONS,
    "branches": $THRESHOLD_BRANCHES,
    "statements": $THRESHOLD_STATEMENTS
  },
  "components": {
    "backend": {
      "lines": $b_lines,
      "functions": $b_functions,
      "branches": $b_branches,
      "statements": $b_statements
    },
    "frontend": {
      "lines": $f_lines,
      "functions": $f_functions,
      "branches": $f_branches,
      "statements": $f_statements
    }
  },
  "overall": {
    "lines": $(( (b_lines + f_lines) / 2 )),
    "functions": $(( (b_functions + f_functions) / 2 )),
    "branches": $(( (b_branches + f_branches) / 2 )),
    "statements": $(( (b_statements + f_statements) / 2 ))
  }
}
EOF
    
    echo "JSON coverage report generated: $json_file"
}

main() {
    print_header
    
    # Create coverage directory
    mkdir -p "$COVERAGE_DIR"
    
    # Copy individual coverage reports
    if [ -d "backend/coverage" ]; then
        cp -r backend/coverage "$COVERAGE_DIR/backend"
        echo "Backend coverage copied"
    fi
    
    if [ -d "frontend/coverage" ]; then
        cp -r frontend/coverage "$COVERAGE_DIR/frontend"
        echo "Frontend coverage copied"
    fi
    
    # Generate reports
    generate_text_report
    generate_html_report
    generate_json_report
    
    echo -e "\n${GREEN}Coverage reports generated successfully!${NC}"
    echo "View reports at:"
    echo "  - Text: Console output above"
    echo "  - HTML: $COVERAGE_DIR/combined-report.html"
    echo "  - JSON: $COVERAGE_DIR/coverage-summary.json"
}

main "$@"