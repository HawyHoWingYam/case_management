#!/bin/bash

# ===========================================
# 案件管理系统 - 镜像构建脚本
# ===========================================

set -e

echo "🔨 开始构建 Docker 镜像..."

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker 未运行，请先启动 Docker Desktop"
    exit 1
fi

# 设置镜像标签
BACKEND_IMAGE="case-management-backend"
FRONTEND_IMAGE="case-management-frontend"
VERSION_TAG=${1:-"latest"}

echo "📦 构建后端镜像..."
cd backend
docker build -t ${BACKEND_IMAGE}:${VERSION_TAG} .
docker tag ${BACKEND_IMAGE}:${VERSION_TAG} ${BACKEND_IMAGE}:latest
cd ..

echo "📦 构建前端镜像..."
cd frontend  
docker build -t ${FRONTEND_IMAGE}:${VERSION_TAG} .
docker tag ${FRONTEND_IMAGE}:${VERSION_TAG} ${FRONTEND_IMAGE}:latest
cd ..

echo "✅ 镜像构建完成！"
echo ""
echo "🖼️ 构建的镜像："
docker images | grep -E "(case-management|REPOSITORY)"

echo ""
echo "📋 镜像信息："
echo "  后端镜像: ${BACKEND_IMAGE}:${VERSION_TAG}"
echo "  前端镜像: ${FRONTEND_IMAGE}:${VERSION_TAG}"
echo ""
echo "🚀 接下来您可以："
echo "  1. 在 Docker Desktop 中查看镜像"
echo "  2. 运行 docker-compose up 启动服务"
echo "  3. 运行 ./push-images.sh 推送到仓库"
echo "  4. 运行 ./export-images.sh 导出镜像文件"