# 技術堆疊與架構決策

## 前端技術堆疊

### 主要框架
- **Next.js 14+**
  - 理由: 提供 SSR/SSG 支援，優化 SEO 表現
  - 特色: App Router、檔案式路由、自動程式碼分割
  - 優勢: 優秀的開發體驗與效能表現

### UI 開發
- **React 18+**: 前端元件開發
- **TypeScript**: 型別安全與開發效率
- **Tailwind CSS**: 快速響應式樣式開發
- **React Hook Form**: 表單處理與驗證

### 狀態管理
- **React Context** (輕量級狀態)
- **SWR / TanStack Query**: 伺服器狀態管理與快取

### 資料視覺化
- **Recharts** 或 **Chart.js**: 圖表與儀表板
- **React Table**: 資料表格元件

## 後端技術堆疊

### 主要框架
- **NestJS**
  - 理由: TypeScript 原生支援，企業級架構
  - 特色: 依賴注入、裝飾器、模組化設計
  - 優勢: 高度可測試性與可維護性

### 資料庫與 ORM
- **PostgreSQL**
  - 理由: 成熟的關聯式資料庫，支援複雜查詢
  - 特色: ACID 特性、JSON 支援、擴展性佳

- **TypeORM** 或 **Prisma**
  - TypeORM: 裝飾器風格，與 NestJS 整合佳
  - Prisma: 型別安全，優秀的開發體驗
  - 建議: 優先選擇 Prisma（更現代化）

### 身份驗證與授權
- **Passport.js**: 多策略身份驗證支援
- **JWT**: 無狀態驗證令牌
- **bcrypt**: 密碼雜湊處理

### 檔案處理
- **Multer**: 檔案上傳中介軟體
- **AWS SDK**: S3 整合，檔案雲端儲存

### 郵件服務
- **Nodemailer**: 郵件發送功能
- **SendGrid** 或 **AWS SES**: 雲端郵件服務

## 雲端服務與基礎設施

### 儲存服務
- **AWS S3**: 檔案儲存與 CDN
- **CloudFront**: 全球內容分發網路

### 資料庫託管
- **AWS RDS** (PostgreSQL): 託管資料庫服務
- **備選**: Google Cloud SQL, Azure Database

### 部署平台
- **前端**: Vercel (Next.js 官方推薦)
- **後端**: AWS EC2 / Google Cloud Run / Heroku
- **容器化**: Docker (後端應用打包)

## 開發工具與流程

### 版本控制
- **Git**: 版本控制系統
- **GitHub**: 程式碼託管與協作

### 開發環境
- **Node.js 18+**: 執行環境
- **pnpm** 或 **yarn**: 套件管理器
- **ESLint + Prettier**: 程式碼品質與格式化

### 測試框架
- **Jest**: 單元測試與整合測試
- **React Testing Library**: 前端元件測試
- **Supertest**: API 端點測試

### CI/CD
- **GitHub Actions**: 自動化測試與部署
- **Docker**: 容器化部署

## 資料庫設計

### 核心資料實體

#### User (使用者)
```sql
id: PRIMARY KEY
email: UNIQUE, NOT NULL
password_hash: NOT NULL
role: ENUM('Clerk', 'Chair', 'Caseworker')
name: NOT NULL
created_at: TIMESTAMP
updated_at: TIMESTAMP
```

#### Case (案件)
```sql
id: PRIMARY KEY
title: NOT NULL
description: TEXT
status: ENUM('New', 'Pending Review', 'Assigned', 'In Progress', 'Completed', 'Rejected')
priority: ENUM('Low', 'Medium', 'High', 'Urgent')
created_by: FOREIGN KEY -> User.id
assigned_caseworker: FOREIGN KEY -> User.id (NULLABLE)
created_at: TIMESTAMP
updated_at: TIMESTAMP
due_date: TIMESTAMP (NULLABLE)
```

#### Case_Log (案件日誌)
```sql
id: PRIMARY KEY
case_id: FOREIGN KEY -> Case.id
user_id: FOREIGN KEY -> User.id
action: VARCHAR (e.g., 'Created', 'Assigned', 'Status Changed')
description: TEXT
created_at: TIMESTAMP
```

#### Case_Attachment (案件附件)
```sql
id: PRIMARY KEY
case_id: FOREIGN KEY -> Case.id
filename: NOT NULL
s3_key: NOT NULL (S3 儲存路徑)
file_size: INTEGER
content_type: VARCHAR
uploaded_by: FOREIGN KEY -> User.id
created_at: TIMESTAMP
```

## 安全性考量

### 資料保護
- **HTTPS**: 全站加密傳輸
- **輸入驗證**: 防止 SQL 注入與 XSS 攻擊
- **CORS**: 跨域請求控制

### 身份驗證
- **JWT 令牌**: 設定適當過期時間
- **角色權限**: 細粒度存取控制
- **密碼政策**: 強制複雜密碼要求

### 檔案安全
- **檔案類型檢查**: 限制允許的檔案格式
- **檔案大小限制**: 防止惡意大檔案上傳
- **病毒掃描**: 整合雲端安全服務

## 效能優化

### 前端優化
- **程式碼分割**: 按路由載入
- **圖片優化**: Next.js Image 元件
- **快取策略**: SWR 資料快取

### 後端優化
- **資料庫索引**: 查詢效能優化
- **連線池**: PostgreSQL 連線管理
- **API 快取**: Redis 快取層（可選）

### CDN 加速
- **靜態資源**: CloudFront 分發
- **檔案下載**: S3 直接存取

---

*此技術堆疊經過慎重評估，平衡了開發效率、系統效能與長期維護性。*