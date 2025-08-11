#!/bin/bash

# ===========================================
# 案件管理系统 - 备份脚本
# ===========================================

set -e

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "💾 开始备份案件管理系统数据..."

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
echo "📀 备份数据库..."
docker-compose exec -T postgres pg_dump -U postgres case_management_db > "$BACKUP_DIR/database_$TIMESTAMP.sql"

# 备份上传文件
echo "📁 备份上传文件..."
if [ -d "./backend/uploads" ]; then
    tar -czf "$BACKUP_DIR/uploads_$TIMESTAMP.tar.gz" -C "./backend" uploads
fi

# 备份MinIO数据（如果存在）
echo "🗄️ 备份MinIO数据..."
if docker-compose ps | grep -q "minio.*Up"; then
    docker run --rm \
        --volumes-from case_management_minio \
        -v "$PWD/$BACKUP_DIR":/backup \
        alpine tar czf /backup/minio_$TIMESTAMP.tar.gz /data
fi

# 备份环境配置（脱敏）
echo "⚙️ 备份配置文件..."
if [ -f ".env.production" ]; then
    # 复制配置文件但移除敏感信息
    sed -E 's/(PASSWORD|SECRET|KEY)=.*/\1=***REDACTED***/g' .env.production > "$BACKUP_DIR/config_$TIMESTAMP.env"
fi

echo "✅ 备份完成！"
echo "📦 备份文件位置: $BACKUP_DIR/"
ls -la "$BACKUP_DIR/"

# 清理旧备份（保留最近5个）
echo "🧹 清理旧备份..."
find $BACKUP_DIR -name "database_*.sql" -type f | sort -r | tail -n +6 | xargs rm -f
find $BACKUP_DIR -name "uploads_*.tar.gz" -type f | sort -r | tail -n +6 | xargs rm -f
find $BACKUP_DIR -name "minio_*.tar.gz" -type f | sort -r | tail -n +6 | xargs rm -f
find $BACKUP_DIR -name "config_*.env" -type f | sort -r | tail -n +6 | xargs rm -f

echo "🎉 备份和清理完成！"