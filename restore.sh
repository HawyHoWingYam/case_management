#!/bin/bash

# ===========================================
# 案件管理系统 - 恢复脚本
# ===========================================

set -e

BACKUP_DIR="./backups"

if [ $# -eq 0 ]; then
    echo "🔄 案件管理系统数据恢复工具"
    echo ""
    echo "用法: $0 <备份时间戳>"
    echo ""
    echo "可用的备份："
    if [ -d "$BACKUP_DIR" ]; then
        ls -1 "$BACKUP_DIR"/database_*.sql 2>/dev/null | sed 's/.*database_\(.*\)\.sql/  \1/' || echo "  无可用备份"
    else
        echo "  备份目录不存在"
    fi
    exit 1
fi

TIMESTAMP=$1
DATABASE_BACKUP="$BACKUP_DIR/database_$TIMESTAMP.sql"
UPLOADS_BACKUP="$BACKUP_DIR/uploads_$TIMESTAMP.tar.gz"
MINIO_BACKUP="$BACKUP_DIR/minio_$TIMESTAMP.tar.gz"

echo "🔄 开始恢复数据（时间戳: $TIMESTAMP）..."

# 确认操作
read -p "⚠️  这将覆盖现有数据，是否确认继续？(y/N): " confirm
if [[ $confirm != [yY] && $confirm != [yY][eE][sS] ]]; then
    echo "❌ 恢复操作已取消"
    exit 1
fi

# 停止应用服务
echo "🛑 停止应用服务..."
docker-compose stop backend frontend

# 恢复数据库
if [ -f "$DATABASE_BACKUP" ]; then
    echo "📀 恢复数据库..."
    docker-compose exec -T postgres dropdb -U postgres --if-exists case_management_db
    docker-compose exec -T postgres createdb -U postgres case_management_db
    docker-compose exec -T postgres psql -U postgres case_management_db < "$DATABASE_BACKUP"
    echo "✅ 数据库恢复完成"
else
    echo "⚠️  数据库备份文件不存在: $DATABASE_BACKUP"
fi

# 恢复上传文件
if [ -f "$UPLOADS_BACKUP" ]; then
    echo "📁 恢复上传文件..."
    rm -rf ./backend/uploads
    tar -xzf "$UPLOADS_BACKUP" -C ./backend/
    echo "✅ 上传文件恢复完成"
else
    echo "⚠️  上传文件备份不存在: $UPLOADS_BACKUP"
fi

# 恢复MinIO数据
if [ -f "$MINIO_BACKUP" ]; then
    echo "🗄️ 恢复MinIO数据..."
    docker-compose stop minio
    docker run --rm \
        --volumes-from case_management_minio \
        -v "$PWD/$BACKUP_DIR":/backup \
        alpine sh -c "rm -rf /data/* && tar xzf /backup/minio_$TIMESTAMP.tar.gz -C /"
    docker-compose start minio
    echo "✅ MinIO数据恢复完成"
else
    echo "⚠️  MinIO备份文件不存在: $MINIO_BACKUP"
fi

# 重新启动应用服务
echo "🚀 重新启动应用服务..."
docker-compose up -d backend frontend

echo "🎉 数据恢复完成！"
echo "🌐 应用访问地址: http://localhost:3000"