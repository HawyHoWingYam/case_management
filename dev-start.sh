#!/bin/bash

# ===========================================
# 案件管理系统 - 开发环境启动脚本
# ===========================================

set -e

echo "🔧 启动开发环境..."

# 检查 Docker
command -v docker >/dev/null 2>&1 || { echo "❌ Docker 未安装" >&2; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "❌ Docker Compose 未安装" >&2; exit 1; }

# 检查开发环境配置文件
if [ ! -f .env.development ]; then
    echo "⚠️  复制开发环境配置..."
    cp .env.example .env.development
fi

# 启动基础服务（数据库、Redis、MinIO）
echo "🚀 启动基础服务..."
docker-compose up -d postgres redis minio pgadmin

# 等待服务启动
echo "⏳ 等待基础服务启动..."
sleep 10

echo "✅ 开发环境基础服务已启动！"
echo ""
echo "📱 服务地址："
echo "  - 数据库: localhost:5432"
echo "  - Redis: localhost:6379"  
echo "  - MinIO: http://localhost:9001 (用户名: minio, 密码: minio123)"
echo "  - pgAdmin: http://localhost:5050 (邮箱: admin@example.com, 密码: admin123)"
echo ""
echo "💻 接下来请在两个终端中分别运行："
echo "  终端1 (后端): cd backend && npm run start:dev"
echo "  终端2 (前端): cd frontend && npm run dev"
echo ""
echo "🛑 停止服务: docker-compose down"