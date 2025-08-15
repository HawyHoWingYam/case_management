#!/bin/bash

# ===========================================
# 案件管理系统 - 推送镜像到 Docker Hub
# ===========================================

set -e

# 配置
DOCKER_USERNAME=${DOCKER_USERNAME:-"your-dockerhub-username"}
BACKEND_IMAGE="case-management-backend"
FRONTEND_IMAGE="case-management-frontend"
VERSION_TAG=${1:-"latest"}

if [ "$DOCKER_USERNAME" = "your-dockerhub-username" ]; then
    echo "⚠️  请设置您的 Docker Hub 用户名："
    echo "  方法1: export DOCKER_USERNAME=your-username"
    echo "  方法2: 编辑此脚本修改 DOCKER_USERNAME"
    echo ""
    read -p "请输入您的 Docker Hub 用户名: " input_username
    if [ -n "$input_username" ]; then
        DOCKER_USERNAME="$input_username"
    else
        echo "❌ 未输入用户名，退出"
        exit 1
    fi
fi

echo "🔐 登录 Docker Hub..."
if ! docker login; then
    echo "❌ Docker Hub 登录失败"
    exit 1
fi

echo "🏷️ 标记镜像..."
docker tag ${BACKEND_IMAGE}:${VERSION_TAG} ${DOCKER_USERNAME}/${BACKEND_IMAGE}:${VERSION_TAG}
docker tag ${BACKEND_IMAGE}:${VERSION_TAG} ${DOCKER_USERNAME}/${BACKEND_IMAGE}:latest

docker tag ${FRONTEND_IMAGE}:${VERSION_TAG} ${DOCKER_USERNAME}/${FRONTEND_IMAGE}:${VERSION_TAG}
docker tag ${FRONTEND_IMAGE}:${VERSION_TAG} ${DOCKER_USERNAME}/${FRONTEND_IMAGE}:latest

echo "📤 推送后端镜像..."
docker push ${DOCKER_USERNAME}/${BACKEND_IMAGE}:${VERSION_TAG}
docker push ${DOCKER_USERNAME}/${BACKEND_IMAGE}:latest

echo "📤 推送前端镜像..."
docker push ${DOCKER_USERNAME}/${FRONTEND_IMAGE}:${VERSION_TAG}
docker push ${DOCKER_USERNAME}/${FRONTEND_IMAGE}:latest

echo "✅ 镜像推送完成！"
echo ""
echo "🌐 Docker Hub 地址："
echo "  后端: https://hub.docker.com/r/${DOCKER_USERNAME}/${BACKEND_IMAGE}"
echo "  前端: https://hub.docker.com/r/${DOCKER_USERNAME}/${FRONTEND_IMAGE}"
echo ""
echo "📋 其他人可以通过以下命令获取镜像："
echo "  docker pull ${DOCKER_USERNAME}/${BACKEND_IMAGE}:${VERSION_TAG}"
echo "  docker pull ${DOCKER_USERNAME}/${FRONTEND_IMAGE}:${VERSION_TAG}"