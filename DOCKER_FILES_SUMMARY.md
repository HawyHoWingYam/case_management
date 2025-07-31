# Case Management Docker Environment - Files Summary

## 建立的檔案結構

```
case_management/
├── docker-compose.dev.yml           # 主要 Docker Compose 配置
├── .env.dev                        # 開發環境變數配置
├── Makefile                        # 簡化命令的 Makefile
├── DOCKER_SETUP.md                 # 完整設置指南
├── DOCKER_FILES_SUMMARY.md         # 本檔案 - 檔案摘要
├── docker/
│   ├── README.md                   # Docker 環境詳細說明
│   ├── postgres/
│   │   ├── init/                   # PostgreSQL 初始化腳本
│   │   │   ├── 01-create-databases.sql
│   │   │   ├── 02-create-initial-tables.sql
│   │   │   └── 03-seed-data.sql
│   │   └── config/
│   │       └── postgresql.conf     # PostgreSQL 配置
│   ├── redis/
│   │   └── redis.conf             # Redis 配置
│   ├── localstack/
│   │   └── init/
│   │       └── 01-create-s3-buckets.sh  # LocalStack S3 初始化
│   └── pgadmin/
│       └── servers.json           # pgAdmin 伺服器配置
└── scripts/
    ├── check-prerequisites.sh      # 前置條件檢查腳本
    ├── docker-dev.sh              # 主要 Docker 管理腳本
    └── validate-docker-env.sh     # 環境驗證腳本
```

## 服務配置摘要

### 1. PostgreSQL 資料庫
- **版本**: PostgreSQL 15 Alpine
- **連接埠**: 5432
- **開發資料庫**: case_management_dev
- **測試資料庫**: case_management_test
- **使用者**: postgres
- **密碼**: postgres_dev_password
- **功能**: 
  - 自動建立開發和測試資料庫
  - 啟用 UUID、加密、大小寫不敏感文字擴展
  - 建立核心資料表結構
  - 插入範例資料
  - 效能最佳化配置

### 2. Redis 快取
- **版本**: Redis 7 Alpine
- **連接埠**: 6379
- **配置**: 開發環境最佳化
- **持久化**: RDB + AOF
- **記憶體限制**: 256MB

### 3. LocalStack (AWS S3 模擬)
- **服務**: S3, SNS, SQS
- **連接埠**: 4566
- **區域**: us-east-1
- **憑證**: test/test
- **預建立的儲存桶**:
  - case-management-dev
  - case-management-documents
  - case-management-uploads
  - case-management-exports
  - case-management-backups

### 4. MailHog (郵件測試)
- **SMTP 連接埠**: 1025
- **Web UI 連接埠**: 8025
- **Web 介面**: http://localhost:8025

### 5. pgAdmin (資料庫管理)
- **連接埠**: 5050
- **Web 介面**: http://localhost:5050
- **登入**: admin@casemanagement.dev / admin123
- **預設連線**: 自動配置到 PostgreSQL

## 核心指令

### 使用 Makefile (建議)
```bash
make help                    # 顯示所有可用命令
make setup                   # 初始設置
make check-prereqs          # 檢查前置條件
make dev-start              # 啟動所有服務
make dev-stop               # 停止所有服務
make dev-status             # 顯示服務狀態
make dev-validate           # 驗證環境
make dev-logs               # 顯示所有日誌
make dev-clean              # 清理所有資料
make urls                   # 顯示服務 URL
```

### 使用腳本
```bash
./scripts/check-prerequisites.sh    # 檢查前置條件
./scripts/docker-dev.sh start      # 啟動服務
./scripts/docker-dev.sh status     # 檢查狀態
./scripts/validate-docker-env.sh   # 驗證環境
```

## 資料庫結構

### 核心資料表
- **users**: 系統使用者和案件工作者
- **cases**: 案件管理記錄
- **case_notes**: 案件文件記錄
- **audit.audit_logs**: 系統稽核追蹤
- **security.user_sessions**: 認證會話

### 列舉類型
- **case_status**: open, in_progress, pending, closed, archived
- **case_priority**: low, medium, high, urgent
- **user_role**: admin, supervisor, caseworker, client
- **audit_action**: CREATE, UPDATE, DELETE, LOGIN, LOGOUT

### 預設資料
- 管理員使用者
- 範例案件工作者
- 範例案件和註記
- 稽核日誌範例

## 快速開始流程

1. **檢查前置條件**:
   ```bash
   ./scripts/check-prerequisites.sh
   ```

2. **初始設置**:
   ```bash
   make setup
   ```

3. **啟動服務** (需要先啟動 Docker Desktop):
   ```bash
   make dev-start
   ```

4. **驗證環境**:
   ```bash
   make dev-validate
   ```

5. **查看服務狀態**:
   ```bash
   make dev-status
   ```

## 連線資訊

### 資料庫連線字串
```
開發環境: postgresql://postgres:postgres_dev_password@localhost:5432/case_management_dev
測試環境: postgresql://postgres:postgres_dev_password@localhost:5432/case_management_test
```

### Redis 連線字串
```
redis://localhost:6379
```

### AWS/LocalStack 配置
```
S3_ENDPOINT=http://localhost:4566
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_DEFAULT_REGION=us-east-1
```

### SMTP 配置
```
SMTP_HOST=localhost
SMTP_PORT=1025
```

## 故障排除

### 常見問題
1. **Docker 未執行**: 啟動 Docker Desktop
2. **連接埠衝突**: 檢查其他服務佔用相同連接埠
3. **服務啟動失敗**: 查看日誌 `make dev-logs`
4. **資料庫連線失敗**: 等待服務完全啟動

### 重置環境
```bash
make dev-clean              # 清理所有資料
make dev-start              # 重新啟動
make dev-validate           # 驗證
```

## 安全注意事項

⚠️ **僅用於開發環境**

此配置包含：
- 弱密碼
- 停用 SSL
- 開放的 CORS 設置
- 啟用偵錯日誌
- 測試用憑證

**生產環境必須**：
- 使用強密碼
- 啟用 SSL/TLS
- 配置適當的安全群組
- 使用受管理的資料庫服務
- 實施適當的備份策略

## 整合範例

### NestJS Backend 配置
```typescript
// app.module.ts
@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env.dev',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT),
      database: process.env.DATABASE_NAME,
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
    }),
  ],
})
```

### Next.js Frontend 配置
```javascript
// next.config.js
module.exports = {
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    REDIS_URL: process.env.REDIS_URL,
    S3_ENDPOINT: process.env.S3_ENDPOINT,
  },
};
```

## 檔案用途說明

### 配置檔案
- **docker-compose.dev.yml**: 定義所有服務、網路、存儲卷
- **.env.dev**: 開發環境變數
- **Makefile**: 簡化常用命令

### 初始化腳本
- **01-create-databases.sql**: 建立資料庫和擴展
- **02-create-initial-tables.sql**: 建立資料表結構
- **03-seed-data.sql**: 插入範例資料
- **01-create-s3-buckets.sh**: 建立 S3 儲存桶

### 管理腳本
- **check-prerequisites.sh**: 檢查系統需求
- **docker-dev.sh**: 主要服務管理
- **validate-docker-env.sh**: 全面環境驗證

### 配置檔案
- **postgresql.conf**: PostgreSQL 效能配置
- **redis.conf**: Redis 記憶體和持久化配置
- **servers.json**: pgAdmin 自動連線配置

## 維護和更新

### 定期維護
```bash
make dev-backup             # 定期備份資料庫
make clean-logs             # 清理日誌檔案
make clean-docker           # 清理 Docker 系統
```

### 更新服務
1. 修改 `docker-compose.dev.yml` 中的映像版本
2. 重新啟動服務 `make dev-restart`
3. 驗證環境 `make dev-validate`

### 新增服務
1. 在 `docker-compose.dev.yml` 中新增服務定義
2. 新增相應的配置檔案到 `docker/` 目錄
3. 更新驗證腳本
4. 更新文件

---

**需要協助？** 執行 `make help` 查看可用命令，或檢查 `DOCKER_SETUP.md` 獲取詳細設置指南。