#!/bin/bash

# ===========================================
# 案件管理系统 - 镜像测试脚本
# ===========================================

set -e

echo "🧪 测试 Docker 镜像..."

# 检查镜像是否存在
echo "🔍 检查镜像是否存在..."
if docker images | grep -q "case-management-backend"; then
    echo "✅ 后端镜像存在"
else
    echo "❌ 后端镜像不存在"
    exit 1
fi

if docker images | grep -q "case-management-frontend"; then
    echo "✅ 前端镜像存在"
else
    echo "❌ 前端镜像不存在" 
    exit 1
fi

echo ""
echo "🚀 启动完整应用栈进行测试..."

# 使用docker-compose启动所有服务
docker-compose up -d

echo ""
echo "⏳ 等待服务启动（60秒）..."
sleep 60

echo ""
echo "🔍 检查服务状态..."
docker-compose ps

echo ""
echo "🌐 服务访问测试："
echo "  - 前端: http://localhost:3000"
echo "  - 后端: http://localhost:3001" 
echo "  - API文档: http://localhost:3001/api"

echo ""
echo "💡 在浏览器中访问以下地址来验证部署："
echo "  1. 前端应用: http://localhost:3000"
echo "  2. 后端健康检查: http://localhost:3001/health"
echo "  3. Swagger API文档: http://localhost:3001/api"

echo ""
echo "🔧 有用的命令："
echo "  查看日志: docker-compose logs -f [service-name]"
echo "  停止服务: docker-compose down"
echo "  重启服务: docker-compose restart [service-name]"