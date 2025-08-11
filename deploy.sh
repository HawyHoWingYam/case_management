#!/bin/bash

# ===========================================
# 案件管理系统 - Docker 部署脚本
# ===========================================

set -e  # 遇到错误时退出

echo "🚀 开始部署案件管理系统..."

# 检查 Docker 和 Docker Compose 是否安装
command -v docker >/dev/null 2>&1 || { echo "❌ 错误: Docker 未安装. 请先安装 Docker." >&2; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "❌ 错误: Docker Compose 未安装. 请先安装 Docker Compose." >&2; exit 1; }

echo "✅ Docker 和 Docker Compose 已安装"

# 检查环境文件
if [ ! -f .env.production ]; then
    echo "⚠️  .env.production 文件不存在，正在复制示例文件..."
    cp .env.example .env.production
    echo "📝 请编辑 .env.production 文件并配置正确的值"
    read -p "按任意键继续部署，或按 Ctrl+C 退出编辑配置文件..."
fi

# 创建必要的目录
echo "📁 创建必要的目录..."
mkdir -p backend/uploads
mkdir -p logs
mkdir -p minio-data

# 停止现有的容器（如果存在）
echo "🛑 停止现有容器..."
docker-compose down --remove-orphans || true

# 构建并启动服务
echo "🔨 构建 Docker 镜像..."
docker-compose build --no-cache

echo "🚀 启动服务..."
docker-compose up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 30

# 检查服务状态
echo "🔍 检查服务状态..."
docker-compose ps

# 检查服务健康状态
echo "💚 检查服务健康状态..."
for service in postgres redis minio backend frontend; do
    if docker-compose ps | grep -q "$service.*Up"; then
        echo "✅ $service: 运行正常"
    else
        echo "❌ $service: 未运行"
    fi
done

# 显示访问信息
echo ""
echo "🎉 部署完成！"
echo ""
echo "📱 应用访问地址:"
echo "  - 前端: http://localhost:3000"
echo "  - 后端 API: http://localhost:3001"
echo "  - API 文档: http://localhost:3001/api"
echo ""
echo "🛠️ 管理工具:"
echo "  - pgAdmin (数据库): http://localhost:5050"
echo "    用户名: admin@example.com"
echo "    密码: admin123"
echo "  - MinIO (文件存储): http://localhost:9001"
echo "    用户名: minio"
echo "    密码: minio123"
echo ""
echo "📊 查看日志命令:"
echo "  docker-compose logs -f [service-name]"
echo ""
echo "🔧 常用命令:"
echo "  停止所有服务: docker-compose down"
echo "  重启服务: docker-compose restart [service-name]"
echo "  查看状态: docker-compose ps"
echo ""