# Claude MCP -> n8n 自动化部署系统

## 概述

这个自动化系统实现了从 Claude MCP 生成 n8n workflow 配置到自动部署的完整流程，无需手动操作 n8n 界面。

## 功能特性

- ✅ **多种预定义模板**：API-Slack、Webhook-DB、AI-Chain 等
- ✅ **自动验证**：部署前验证 workflow 配置
- ✅ **一键激活**：部署后可自动激活 workflow
- ✅ **完整日志**：详细的执行日志和错误处理
- ✅ **本地备份**：自动保存 workflow 配置到本地
- ✅ **调试模式**：支持详细调试输出

## 快速开始

### 1. 环境准备

确保你的 n8n 服务正在运行：
```bash
# 启动 n8n（如果还没启动）
n8n start

# 验证服务状态
curl http://localhost:5678/healthz
```

### 2. 脚本权限设置

```bash
cd /Users/hawyho/Documents/GitHub/case_management/scripts
chmod +x claude-n8n-auto-deploy.sh
chmod +x quick-deploy.sh
```

### 3. 快速部署示例

```bash
# 最简单的使用方式
./quick-deploy.sh "My First Workflow"

# 或者使用完整脚本
./claude-n8n-auto-deploy.sh "Customer Notification" "处理客户通知的工作流"
```

## 详细用法

### 基本命令格式

```bash
./claude-n8n-auto-deploy.sh [选项] <workflow-name> [workflow-description]
```

### 命令选项

| 选项 | 说明 | 示例 |
|------|------|------|
| `-h, --help` | 显示帮助信息 | `./script.sh -h` |
| `-t, --template <type>` | 使用预定义模板 | `./script.sh -t api-slack "API Workflow"` |
| `-v, --validate` | 只验证不部署 | `./script.sh -v "Test Workflow"` |
| `-a, --activate` | 部署后自动激活 | `./script.sh -a "Active Workflow"` |
| `-d, --debug` | 调试模式 | `./script.sh -d "Debug Workflow"` |

### 可用模板类型

1. **api-slack**: API 数据处理并发送到 Slack
2. **webhook-db**: Webhook 接收数据并存储到数据库
3. **basic**: 基础的数据处理模板

### 使用示例

```bash
# 创建 API 到 Slack 的工作流，并自动激活
./claude-n8n-auto-deploy.sh -t api-slack -a "Customer Alert System"

# 创建 Webhook 到数据库的工作流
./claude-n8n-auto-deploy.sh -t webhook-db "Order Processing" "处理订单数据"

# 只验证不部署
./claude-n8n-auto-deploy.sh -v -t basic "Test Validation"

# 调试模式创建工作流
./claude-n8n-auto-deploy.sh -d -t api-slack "Debug Workflow"
```

## 自动化流程说明

### 第1步：环境检查
- 验证 n8n 服务运行状态
- 检查必要的依赖工具（curl, jq）
- 创建必要的目录结构

### 第2步：生成 Workflow
- 根据指定模板生成 workflow JSON
- 自动替换模板变量（名称、描述等）
- 生成带时间戳的临时文件

### 第3步：验证配置
- 检查 JSON 格式有效性
- 验证必要字段完整性
- 确保 workflow 结构正确

### 第4步：部署到 n8n
- 调用 n8n REST API 创建 workflow
- 处理 API 响应和错误
- 可选：自动激活 workflow

### 第5步：后续处理
- 保存 workflow 配置到本地备份
- 生成详细的执行日志
- 提供访问链接和后续操作建议

## 目录结构

```
case_management/
├── scripts/
│   ├── claude-n8n-auto-deploy.sh    # 主自动化脚本
│   └── quick-deploy.sh              # 快速部署脚本
├── logs/
│   └── n8n-deploy.log              # 部署日志
├── workflows/                       # 本地备份
│   └── *.json                      # 已部署的 workflow 配置
└── /tmp/n8n-workflows/             # 临时文件
```

## 高级功能

### 批量部署

创建多个 workflow：
```bash
#!/bin/bash
workflows=("User Registration" "Order Processing" "Email Notifications")
for wf in "${workflows[@]}"; do
    ./claude-n8n-auto-deploy.sh -t api-slack -a "$wf"
    sleep 2  # 避免 API 限制
done
```

### 环境配置

脚本内置配置，也可通过环境变量覆盖：
```bash
export N8N_API_URL="http://your-n8n-server:5678"
export N8N_API_KEY="your-api-key"
./claude-n8n-auto-deploy.sh "Remote Workflow"
```

### 错误恢复

如果部署失败，检查日志：
```bash
tail -f logs/n8n-deploy.log
```

常见问题解决：
1. **n8n 服务未运行**：检查 `http://localhost:5678`
2. **API 密钥无效**：更新脚本中的 `N8N_API_KEY`
3. **JSON 格式错误**：使用 `-v` 选项先验证

## 集成 CI/CD

可以将此脚本集成到 CI/CD 流程中：

```yaml
# GitHub Actions 示例
- name: Deploy n8n Workflow
  run: |
    cd scripts
    ./claude-n8n-auto-deploy.sh -t api-slack -a "Production Workflow"
```

## 扩展功能

脚本设计为可扩展架构，可以添加：
- 更多 workflow 模板
- 与 Claude MCP 的直接集成
- 自动测试和监控
- 团队协作功能
- 配置管理

## 故障排除

### 常见错误

1. **Permission denied**
   ```bash
   chmod +x claude-n8n-auto-deploy.sh
   ```

2. **n8n service not available**
   ```bash
   # 检查 n8n 是否运行
   ps aux | grep n8n
   # 或重新启动
   n8n start
   ```

3. **API authentication failed**
   - 检查 API 密钥是否正确
   - 确认 n8n 实例支持 API 访问

### 调试技巧

```bash
# 使用调试模式
./claude-n8n-auto-deploy.sh -d "Debug Test"

# 查看详细日志
tail -f logs/n8n-deploy.log

# 验证 JSON 格式
./claude-n8n-auto-deploy.sh -v "Validation Test"
```

## 贡献和反馈

如需添加新功能或报告问题，请：
1. 查看日志文件获取详细错误信息
2. 使用调试模式复现问题
3. 提供具体的使用场景和期望结果