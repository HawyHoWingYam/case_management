# 🐳 Docker Desktop 镜像管理指南

## 📖 概述

本指南将帮助您在 Docker Desktop 中构建、管理和分发案件管理系统的 Docker 镜像。

## 🚀 快速开始

### 1. 构建镜像到 Docker Desktop

```bash
# 构建最新版本的镜像
./build-images.sh

# 构建指定版本的镜像
./build-images.sh v1.0.0
```

构建完成后，您可以在 Docker Desktop 的 Images 标签中看到以下镜像：
- `case-management-backend:latest`
- `case-management-frontend:latest`

### 2. 查看 Docker Desktop 中的镜像

```bash
# 查看系统状态和镜像列表
./docker-status.sh

# 或者直接查看镜像
docker images | grep case-management
```

## 🖼️ 镜像管理操作

### 在 Docker Desktop GUI 中管理

1. **打开 Docker Desktop**
2. **查看镜像**：
   - 点击左侧的 "Images" 标签
   - 找到 `case-management-backend` 和 `case-management-frontend`
   - 可以看到镜像大小、创建时间等信息

3. **运行容器**：
   - 在镜像列表中点击镜像名称
   - 点击 "Run" 按钮
   - 配置端口映射和环境变量
   - 启动容器

4. **管理容器**：
   - 点击 "Containers" 标签
   - 查看运行中的容器状态
   - 可以停止、重启、删除容器

### 命令行管理

```bash
# 查看本地镜像
docker images

# 查看案件管理系统镜像
docker images | grep case-management

# 删除镜像
docker rmi case-management-backend:latest
docker rmi case-management-frontend:latest

# 运行单个容器（测试用）
docker run -d -p 3001:3001 --name test-backend case-management-backend:latest
docker run -d -p 3000:3000 --name test-frontend case-management-frontend:latest
```

## 📤 分发镜像

### 方法1: 推送到 Docker Hub

```bash
# 1. 设置您的 Docker Hub 用户名
export DOCKER_USERNAME=your-dockerhub-username

# 2. 推送镜像
./push-images.sh

# 3. 其他人可以拉取镜像
docker pull your-username/case-management-backend:latest
docker pull your-username/case-management-frontend:latest
```

### 方法2: 导出为文件

```bash
# 1. 导出镜像文件
./export-images.sh

# 2. 生成的文件在 ./docker-images-export/ 目录中
# 3. 将整个目录复制到目标机器
# 4. 在目标机器上导入镜像
cd docker-images-export && ./import-images.sh
```

### 方法3: 通过 Docker Desktop 分享

1. **导出镜像**：
   - 在 Docker Desktop 中右键点击镜像
   - 选择 "Save image"
   - 保存为 .tar 文件

2. **导入镜像**：
   - 将 .tar 文件复制到目标机器
   - 在 Docker Desktop 中点击 "Images" → "Load image"
   - 选择 .tar 文件导入

## 🔄 镜像版本管理

### 标记不同版本

```bash
# 构建特定版本
./build-images.sh v1.0.0

# 手动标记版本
docker tag case-management-backend:latest case-management-backend:v1.0.0
docker tag case-management-frontend:latest case-management-frontend:v1.0.0

# 标记为开发版本
docker tag case-management-backend:latest case-management-backend:dev
docker tag case-management-frontend:latest case-management-frontend:dev
```

### 版本命名规范建议

- `latest` - 最新稳定版
- `v1.0.0` - 语义化版本号
- `dev` - 开发版本
- `staging` - 测试环境版本
- `prod` - 生产环境版本

## 🛠️ 故障排除

### 常见问题

#### 1. Docker Desktop 未运行
```bash
# 错误：Cannot connect to the Docker daemon
# 解决：启动 Docker Desktop 应用
```

#### 2. 镜像构建失败
```bash
# 检查构建日志
docker build -t case-management-backend ./backend

# 清理构建缓存
docker builder prune
```

#### 3. 镜像过大
```bash
# 查看镜像层级
docker history case-management-backend:latest

# 优化 Dockerfile，使用多阶段构建
# 清理不必要的依赖和文件
```

#### 4. 推送到 Docker Hub 失败
```bash
# 确保已登录
docker login

# 检查镜像标签
docker tag case-management-backend:latest username/case-management-backend:latest
```

### 清理镜像空间

```bash
# 清理未使用的镜像
docker image prune

# 清理所有未使用的镜像（危险操作）
docker image prune -a

# 查看 Docker 空间使用
docker system df

# 清理整个 Docker 系统（非常危险）
docker system prune -a --volumes
```

## 📊 监控镜像

### 镜像信息查看

```bash
# 查看镜像详细信息
docker inspect case-management-backend:latest

# 查看镜像历史
docker history case-management-backend:latest

# 查看镜像大小
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
```

### 安全扫描

```bash
# Docker Desktop 内置的安全扫描
docker scout quickview case-management-backend:latest

# 或者在 Docker Desktop GUI 中查看安全报告
```

## 🎯 最佳实践

### 1. 镜像标记策略
- 始终为生产镜像使用具体版本号
- 使用 `latest` 标签表示最新稳定版
- 为不同环境使用不同标签

### 2. 镜像优化
- 使用多阶段构建减小镜像大小
- 定期清理未使用的镜像
- 使用 `.dockerignore` 减少构建上下文

### 3. 安全考虑
- 定期扫描镜像安全漏洞
- 不在镜像中包含敏感信息
- 使用官方基础镜像

### 4. 持续集成
```yaml
# GitHub Actions 示例
name: Build and Push Docker Images
on:
  push:
    tags: ['v*']
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Build images
        run: ./build-images.sh ${{ github.ref_name }}
      - name: Push to Docker Hub
        run: ./push-images.sh ${{ github.ref_name }}
```

## 📞 获取帮助

如果遇到问题：
1. 查看 Docker Desktop 的日志
2. 运行 `./docker-status.sh` 检查状态
3. 检查镜像构建日志
4. 参考 Docker 官方文档

---

🎉 **现在您可以轻松地在 Docker Desktop 中管理案件管理系统的镜像了！**