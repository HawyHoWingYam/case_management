#!/bin/bash

# ===========================================
# 案件管理系统 - Docker Desktop 镜像管理指南
# ===========================================

echo "🐳 案件管理系统 Docker 镜像管理"
echo "================================="
echo ""

# 检查 Docker 状态
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker 未运行"
    echo "请启动 Docker Desktop 后重试"
    exit 1
fi

echo "✅ Docker Desktop 运行正常"
echo ""

# 显示案件管理系统相关镜像
echo "🖼️ 案件管理系统镜像："
echo "--------------------"
if docker images | grep -q "case-management"; then
    docker images | grep -E "(case-management|REPOSITORY)"
else
    echo "未找到案件管理系统镜像"
    echo "请先运行 ./build-images.sh 构建镜像"
fi

echo ""

# 显示 Docker Desktop 中的所有镜像
echo "📋 Docker Desktop 中的所有镜像："
echo "------------------------------"
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}" | head -10

# 显示容器状态
echo ""
echo "🏃 运行中的容器："
echo "----------------"
if docker ps | grep -q "case_management"; then
    docker ps --filter "name=case_management" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
else
    echo "没有运行中的案件管理系统容器"
fi

echo ""
echo "🛠️ 可用命令："
echo "-------------"
echo "  ./build-images.sh [version]     - 构建镜像（默认版本：latest）"
echo "  ./push-images.sh [version]      - 推送镜像到 Docker Hub"
echo "  ./export-images.sh [version]    - 导出镜像文件"
echo "  docker-compose up -d            - 启动所有服务"
echo "  docker-compose down             - 停止所有服务"
echo ""
echo "💡 在 Docker Desktop GUI 中："
echo "  1. 打开 Docker Desktop"
echo "  2. 点击 'Images' 标签查看所有镜像"
echo "  3. 点击 'Containers' 标签查看容器状态"
echo "  4. 可以直接在 GUI 中启动/停止容器"