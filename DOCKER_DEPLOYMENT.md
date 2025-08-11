# 案件管理系统 Docker 部署指南

## 🚀 快速开始

### 前置要求
- Docker 20.10+
- Docker Compose 2.0+
- 至少 4GB 可用内存
- 至少 10GB 可用磁盘空间

### 一键部署

```bash
# 克隆项目（如果还没有）
git clone <your-repo-url>
cd case_management

# 运行部署脚本
./deploy.sh
```

## 📋 详细部署步骤

### 1. 环境配置

复制并配置环境文件：
```bash
cp .env.example .env.production
```

编辑 `.env.production` 文件，必须修改的配置：
- `JWT_SECRET`: 设置强密码（至少32字符）
- `SMTP_*`: 配置邮件服务器信息
- 数据库密码等敏感信息

### 2. 构建和启动

```bash
# 构建镜像
docker-compose build

# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps
```

### 3. 验证部署

检查各服务是否正常运行：
```bash
# 查看所有服务状态
docker-compose ps

# 查看服务日志
docker-compose logs backend
docker-compose logs frontend
```

## 🌐 访问地址

| 服务 | 地址 | 说明 |
|-----|------|------|
| 前端应用 | http://localhost:3000 | 主应用界面 |
| 后端API | http://localhost:3001 | REST API |
| API文档 | http://localhost:3001/api | Swagger文档 |
| pgAdmin | http://localhost:5050 | 数据库管理 |
| MinIO | http://localhost:9001 | 文件存储管理 |

## 🔐 默认登录信息

### 应用登录
首次部署后，系统会自动创建管理员账户：
- 用户名: `admin`
- 密码: `admin123`

### pgAdmin
- 邮箱: `admin@example.com`
- 密码: `admin123`

### MinIO
- 用户名: `minio`
- 密码: `minio123`

## 🛠️ 管理命令

### 服务管理
```bash
# 启动所有服务
docker-compose up -d

# 停止所有服务
docker-compose down

# 重启特定服务
docker-compose restart backend

# 重新构建并启动
docker-compose up --build -d
```

### 日志查看
```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 数据库操作
```bash
# 运行数据库迁移
docker-compose exec backend npx prisma migrate deploy

# 运行数据库种子
docker-compose exec backend npx prisma db seed

# 连接到数据库
docker-compose exec postgres psql -U postgres -d case_management_db
```

## 🔧 故障排除

### 常见问题

#### 1. 端口冲突
如果遇到端口占用错误，修改 `docker-compose.yml` 中的端口映射：
```yaml
ports:
  - "3001:3001"  # 改为 "3002:3001"
```

#### 2. 内存不足
增加 Docker 的内存限制，或在服务中添加资源限制：
```yaml
deploy:
  resources:
    limits:
      memory: 512M
```

#### 3. 数据库连接失败
检查数据库服务是否正常启动：
```bash
docker-compose logs postgres
```

#### 4. 前端无法访问后端API
检查环境变量配置：
- 确保 `NEXT_PUBLIC_API_URL` 指向正确的后端地址
- 检查 CORS 配置

### 查看详细错误信息
```bash
# 查看容器详细信息
docker inspect case_management_backend

# 进入容器调试
docker-compose exec backend sh
docker-compose exec frontend sh
```

## 🚨 生产环境注意事项

### 安全配置
1. **修改所有默认密码**
2. **使用强JWT密钥**
3. **配置HTTPS** (建议使用反向代理)
4. **限制数据库和管理工具的网络访问**

### 性能优化
1. **调整容器资源限制**
2. **配置Redis持久化**
3. **设置日志轮转**
4. **监控磁盘空间**

### 备份策略
```bash
# 数据库备份
docker-compose exec postgres pg_dump -U postgres case_management_db > backup.sql

# 文件备份
docker-compose exec backend tar -czf /tmp/uploads.tar.gz /app/uploads
docker cp case_management_backend:/tmp/uploads.tar.gz ./uploads_backup.tar.gz
```

## 📊 监控和维护

### 健康检查
```bash
# 检查所有服务健康状态
docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

# API健康检查
curl http://localhost:3001/health
```

### 日志管理
建议配置日志轮转以防止日志文件过大：
```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

### 更新部署
```bash
# 拉取最新代码
git pull

# 重新构建并部署
docker-compose build --no-cache
docker-compose up -d

# 清理旧镜像
docker image prune -f
```

## 🆘 获取帮助

如果遇到问题，请提供以下信息：
1. 操作系统和Docker版本
2. 错误日志 (`docker-compose logs`)
3. 服务状态 (`docker-compose ps`)
4. 环境配置（敏感信息请脱敏）