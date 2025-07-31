#!/bin/bash

#=============================================================================
# Claude MCP -> n8n 自动化部署脚本
# 功能：Claude CLI 生成 n8n workflow 配置后，自动导入到本地 n8n 实例
# 作者：Claude Code Assistant
# 版本：1.0
#=============================================================================

set -e  # 遇到错误立即退出

# 配置参数
N8N_API_URL="http://localhost:5678"
N8N_API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwZGVjODc1YS1jZmQzLTQyYTQtYjVmNy03Zjk5N2E1ZTFhNGUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzUzOTQ0OTY1fQ.vZWNnKfzKrf6nefrvO8yx_ikCoItFFH5-fx4xNxJPBE"
WORKSPACE_DIR="/Users/hawyho/Documents/GitHub/case_management"
TEMP_DIR="/tmp/n8n-workflows"
LOG_FILE="$WORKSPACE_DIR/logs/n8n-deploy.log"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log() {
    local level=$1
    shift
    local msg="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo -e "${timestamp} [${level}] ${msg}" | tee -a "$LOG_FILE"
}

log_info() { echo -e "${BLUE}[INFO]${NC} $*" | tee -a "$LOG_FILE"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $*" | tee -a "$LOG_FILE"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $*" | tee -a "$LOG_FILE"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*" | tee -a "$LOG_FILE"; }

# 帮助信息
show_help() {
    cat << EOF
Claude MCP -> n8n 自动化部署脚本

用法:
    $0 [选项] <workflow-name> [workflow-description]

选项:
    -h, --help              显示帮助信息
    -t, --template <type>   使用预定义模板 (api-slack, webhook-db, ai-chain)
    -v, --validate          只验证不部署
    -a, --activate          部署后自动激活 workflow
    -d, --debug             调试模式
    
示例:
    $0 "API to Slack Workflow" "处理API数据并发送到Slack"
    $0 -t api-slack -a "Customer Notification" 
    $0 -v "Test Workflow"

EOF
}

# 检查依赖
check_dependencies() {
    log_info "检查依赖环境..."
    
    # 检查目录结构
    mkdir -p "$TEMP_DIR" "$WORKSPACE_DIR/logs" "$WORKSPACE_DIR/workflows"
    
    # 检查 n8n 服务
    if ! curl -s "$N8N_API_URL/healthz" > /dev/null; then
        log_error "n8n 服务未运行，请先启动 n8n (localhost:5678)"
        exit 1
    fi
    
    # 检查必要命令
    for cmd in curl jq; do
        if ! command -v $cmd &> /dev/null; then
            log_error "缺少依赖命令: $cmd"
            exit 1
        fi
    done
    
    log_success "依赖检查通过"
}

# 生成 workflow 模板
generate_workflow_template() {
    local name="$1"
    local description="$2"
    local template_type="${3:-basic}"
    local timestamp=$(date '+%Y%m%d_%H%M%S')
    local workflow_file="$TEMP_DIR/workflow_${timestamp}.json"
    
    log_info "生成 workflow 模板: $template_type"
    
    case "$template_type" in
        "api-slack")
            cat > "$workflow_file" << 'EOF'
{
  "name": "TEMPLATE_NAME",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "api-trigger",
        "responseMode": "onReceived"
      },
      "id": "webhook-trigger",
      "name": "API Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2.1,
      "position": [240, 300]
    },
    {
      "parameters": {
        "url": "https://jsonplaceholder.typicode.com/users/1",
        "method": "GET",
        "authentication": "none"
      },
      "id": "http-request",
      "name": "Fetch Data",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [460, 300]
    },
    {
      "parameters": {
        "jsCode": "// Process API data\nconst data = $input.first();\nconst message = `New data received: ${data.json.name || 'Unknown'}`;\nreturn { json: { message, timestamp: new Date().toISOString() } };"
      },
      "id": "process-data",
      "name": "Process Data",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [680, 300]
    }
  ],
  "connections": {
    "API Webhook": {
      "main": [
        [
          {
            "node": "Fetch Data",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Fetch Data": {
      "main": [
        [
          {
            "node": "Process Data",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "active": false,
  "settings": {},
  "staticData": {}
}
EOF
            ;;
        "webhook-db")
            cat > "$workflow_file" << 'EOF'
{
  "name": "TEMPLATE_NAME",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "webhook-db",
        "responseMode": "onReceived"
      },
      "id": "webhook-trigger",
      "name": "Webhook Trigger",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2.1,
      "position": [240, 300]
    },
    {
      "parameters": {
        "jsCode": "// Transform webhook data for database\nconst input = $input.first();\nconst dbRecord = {\n  id: Date.now(),\n  data: input.json,\n  created_at: new Date().toISOString(),\n  processed: false\n};\nreturn { json: dbRecord };"
      },
      "id": "transform-data",
      "name": "Transform for DB",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [460, 300]
    }
  ],
  "connections": {
    "Webhook Trigger": {
      "main": [
        [
          {
            "node": "Transform for DB",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "active": false,
  "settings": {},
  "staticData": {}
}
EOF
            ;;
        *)
            # 基础模板
            cat > "$workflow_file" << 'EOF'
{
  "name": "TEMPLATE_NAME",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "basic-trigger",
        "responseMode": "onReceived"
      },
      "id": "webhook-trigger",
      "name": "Start",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2.1,
      "position": [240, 300]
    },
    {
      "parameters": {
        "jsCode": "// Basic data processing\nconst input = $input.first();\nreturn { json: { message: 'Processed', data: input.json, timestamp: new Date().toISOString() } };"
      },
      "id": "process",
      "name": "Process",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [460, 300]
    }
  ],
  "connections": {
    "Start": {
      "main": [
        [
          {
            "node": "Process",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "active": false,
  "settings": {},
  "staticData": {}
}
EOF
            ;;
    esac
    
    # 替换模板变量
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/TEMPLATE_NAME/$name/g" "$workflow_file"
    else
        sed -i "s/TEMPLATE_NAME/$name/g" "$workflow_file"
    fi
    
    echo "$workflow_file"
}

# 验证 workflow
validate_workflow() {
    local workflow_file="$1"
    
    log_info "验证 workflow 配置..."
    
    if ! jq empty "$workflow_file" 2>/dev/null; then
        log_error "Workflow JSON 格式无效"
        cat "$workflow_file" | head -5
        return 1
    fi
    
    # 检查必要字段
    local name=$(jq -r '.name // "empty"' "$workflow_file" 2>/dev/null)
    local nodes=$(jq -r '.nodes | length // 0' "$workflow_file" 2>/dev/null)
    
    if [[ "$name" == "empty" || "$nodes" == "0" ]]; then
        log_error "Workflow 缺少必要字段 (name: $name, nodes: $nodes)"
        return 1
    fi
    
    log_success "Workflow 验证通过: $name"
    return 0
}

# 部署到 n8n
deploy_to_n8n() {
    local workflow_file="$1"
    local activate="$2"
    
    log_info "部署 workflow 到 n8n..."
    
    # 调用 n8n API 创建 workflow (移除 active 字段)
    local temp_workflow=$(mktemp)
    jq 'del(.active)' "$workflow_file" > "$temp_workflow"
    
    local response=$(curl -s -w "%{http_code}" \
        -X POST "$N8N_API_URL/api/v1/workflows" \
        -H "X-N8N-API-KEY: $N8N_API_KEY" \
        -H "Content-Type: application/json" \
        -d @"$temp_workflow" \
        -o "$TEMP_DIR/response.json")
    
    rm "$temp_workflow"
    
    local http_code="${response: -3}"
    
    if [[ "$http_code" == "200" || "$http_code" == "201" ]]; then
        local workflow_id=$(jq -r '.id // empty' "$TEMP_DIR/response.json")
        local workflow_name=$(jq -r '.name // empty' "$TEMP_DIR/response.json")
        
        log_success "Workflow 部署成功: $workflow_name (ID: $workflow_id)"
        
        # 激活 workflow
        if [[ "$activate" == "true" ]]; then
            activate_workflow "$workflow_id"
        fi
        
        # 保存到本地记录
        cp "$workflow_file" "$WORKSPACE_DIR/workflows/${workflow_name// /_}_$(date +%Y%m%d_%H%M%S).json"
        
        return 0
    else
        log_error "部署失败 (HTTP $http_code)"
        cat "$TEMP_DIR/response.json" | jq . 2>/dev/null || cat "$TEMP_DIR/response.json"
        return 1
    fi
}

# 激活 workflow
activate_workflow() {
    local workflow_id="$1"
    
    log_info "激活 workflow: $workflow_id"
    
    local response=$(curl -s -w "%{http_code}" \
        -X PATCH "$N8N_API_URL/api/v1/workflows/$workflow_id" \
        -H "X-N8N-API-KEY: $N8N_API_KEY" \
        -H "Content-Type: application/json" \
        -d '{"active": true}' \
        -o "$TEMP_DIR/activate_response.json")
    
    local http_code="${response: -3}"
    
    if [[ "$http_code" == "200" ]]; then
        log_success "Workflow 已激活"
    else
        log_warning "激活失败，但 workflow 已创建"
    fi
}

# 主函数
main() {
    local workflow_name=""
    local workflow_description=""
    local template_type="basic"
    local validate_only=false
    local activate=false
    local debug=false
    
    # 解析参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -t|--template)
                template_type="$2"
                shift 2
                ;;
            -v|--validate)
                validate_only=true
                shift
                ;;
            -a|--activate)
                activate=true
                shift
                ;;
            -d|--debug)
                debug=true
                set -x
                shift
                ;;
            -*)
                log_error "未知选项: $1"
                show_help
                exit 1
                ;;
            *)
                if [[ -z "$workflow_name" ]]; then
                    workflow_name="$1"
                elif [[ -z "$workflow_description" ]]; then
                    workflow_description="$1"
                fi
                shift
                ;;
        esac
    done
    
    # 检查必要参数
    if [[ -z "$workflow_name" ]]; then
        log_error "请提供 workflow 名称"
        show_help
        exit 1
    fi
    
    log_info "开始 Claude MCP -> n8n 自动化部署"
    log_info "Workflow: $workflow_name"
    log_info "模板类型: $template_type"
    
    # 执行流程
    check_dependencies
    
    local workflow_file=$(generate_workflow_template "$workflow_name" "$workflow_description" "$template_type")
    
    if ! validate_workflow "$workflow_file"; then
        exit 1
    fi
    
    if [[ "$validate_only" == "true" ]]; then
        log_success "验证完成，workflow 文件: $workflow_file"
        exit 0
    fi
    
    if deploy_to_n8n "$workflow_file" "$activate"; then
        log_success "自动化部署完成！"
        log_info "你可以在 n8n 界面查看新创建的 workflow"
        log_info "访问: $N8N_API_URL"
    else
        log_error "部署失败"
        exit 1
    fi
}

# 错误处理
trap 'log_error "脚本执行异常退出"' ERR

# 执行主函数
main "$@"