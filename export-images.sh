#!/bin/bash

# ===========================================
# 案件管理系统 - 导出镜像文件
# ===========================================

set -e

# 配置
BACKEND_IMAGE="case-management-backend"
FRONTEND_IMAGE="case-management-frontend"
VERSION_TAG=${1:-"latest"}
EXPORT_DIR="./docker-images-export"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "📦 开始导出 Docker 镜像..."

# 创建导出目录
mkdir -p "$EXPORT_DIR"

echo "💾 导出后端镜像..."
docker save ${BACKEND_IMAGE}:${VERSION_TAG} | gzip > "$EXPORT_DIR/${BACKEND_IMAGE}-${VERSION_TAG}-${TIMESTAMP}.tar.gz"

echo "💾 导出前端镜像..."
docker save ${FRONTEND_IMAGE}:${VERSION_TAG} | gzip > "$EXPORT_DIR/${FRONTEND_IMAGE}-${VERSION_TAG}-${TIMESTAMP}.tar.gz"

# 导出基础镜像（可选）
echo "💾 导出基础镜像..."
docker save postgres:15-alpine | gzip > "$EXPORT_DIR/postgres-15-alpine-${TIMESTAMP}.tar.gz"
docker save redis:7-alpine | gzip > "$EXPORT_DIR/redis-7-alpine-${TIMESTAMP}.tar.gz"
docker save minio/minio:latest | gzip > "$EXPORT_DIR/minio-latest-${TIMESTAMP}.tar.gz"

# 创建导入脚本
cat > "$EXPORT_DIR/import-images.sh" << EOF
#!/bin/bash
# 镜像导入脚本

echo "📥 开始导入 Docker 镜像..."

# 导入应用镜像
echo "导入后端镜像..."
gunzip -c ${BACKEND_IMAGE}-${VERSION_TAG}-${TIMESTAMP}.tar.gz | docker load

echo "导入前端镜像..."
gunzip -c ${FRONTEND_IMAGE}-${VERSION_TAG}-${TIMESTAMP}.tar.gz | docker load

# 导入基础镜像
echo "导入基础服务镜像..."
gunzip -c postgres-15-alpine-${TIMESTAMP}.tar.gz | docker load
gunzip -c redis-7-alpine-${TIMESTAMP}.tar.gz | docker load
gunzip -c minio-latest-${TIMESTAMP}.tar.gz | docker load

echo "✅ 所有镜像导入完成！"
echo ""
echo "📋 导入的镜像："
docker images | grep -E "(case-management|postgres|redis|minio|REPOSITORY)"
EOF

chmod +x "$EXPORT_DIR/import-images.sh"

echo "✅ 镜像导出完成！"
echo ""
echo "📁 导出文件位置: $EXPORT_DIR/"
ls -lh "$EXPORT_DIR/"

echo ""
echo "📋 文件说明："
echo "  - ${BACKEND_IMAGE}-${VERSION_TAG}-${TIMESTAMP}.tar.gz: 后端镜像"
echo "  - ${FRONTEND_IMAGE}-${VERSION_TAG}-${TIMESTAMP}.tar.gz: 前端镜像"
echo "  - postgres-15-alpine-${TIMESTAMP}.tar.gz: 数据库镜像"
echo "  - redis-7-alpine-${TIMESTAMP}.tar.gz: Redis镜像"
echo "  - minio-latest-${TIMESTAMP}.tar.gz: MinIO镜像"
echo "  - import-images.sh: 导入脚本"
echo ""
echo "🚀 使用说明："
echo "  1. 将整个 $EXPORT_DIR 目录复制到目标机器"
echo "  2. 在目标机器上运行: cd $EXPORT_DIR && ./import-images.sh"
echo "  3. 然后可以使用 docker-compose up 启动服务"