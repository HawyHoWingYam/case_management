#!/bin/bash

# 快速部署脚本 - 简化版本
# 使用方法: ./quick-deploy.sh "Workflow Name"

SCRIPT_DIR=$(dirname "$0")
MAIN_SCRIPT="$SCRIPT_DIR/claude-n8n-auto-deploy.sh"

# 检查主脚本是否存在
if [[ ! -f "$MAIN_SCRIPT" ]]; then
    echo "错误：找不到主脚本 $MAIN_SCRIPT"
    exit 1
fi

# 确保脚本可执行
chmod +x "$MAIN_SCRIPT"

# 运行主脚本
"$MAIN_SCRIPT" -t api-slack -a "$@"