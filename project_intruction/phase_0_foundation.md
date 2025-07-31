# 階段 0: 基礎建設與環境設定
## Foundation & Setup Phase

### 🎯 階段目標
建立專案所需的所有技術基礎架構，為後續開發鋪路。確保開發環境、資料庫、雲端服務等基礎設施都能正常運作。

### ⏱️ 預估時間
**2-3 週**

---

## 📋 主要任務清單

### ✅ 步驟 0.1: 建立技術堆疊與開發環境

#### 前端環境設定
- [ ] **Next.js 專案初始化**
  - 建立 Next.js 14+ 專案
  - 配置 TypeScript 支援
  - 設定 App Router 結構
  - 安裝必要依賴套件

```bash
npx create-next-app@latest case-management-frontend --typescript --tailwind --eslint --app
cd case-management-frontend
npm install @types/node @types/react @types/react-dom
```

- [ ] **前端工具配置**
  - 設定 Tailwind CSS
  - 配置 ESLint 與 Prettier
  - 安裝 React Hook Form
  - 設定 SWR 或 TanStack Query

#### 後端環境設定
- [ ] **NestJS 專案初始化**
  - 建立 NestJS 專案結構
  - 配置 TypeScript 設定
  - 安裝核心依賴套件
  - 設定基本模組架構

```bash
npm i -g @nestjs/cli
nest new case-management-backend
cd case-management-backend
npm install @nestjs/typeorm typeorm pg
```

- [ ] **版本控制設定**
  - 初始化 Git 儲存庫
  - 建立 .gitignore 檔案
  - 設定分支策略 (main, develop, feature/*)
  - 建立初始 commit

---

### ✅ 步驟 0.2: 設定雲端檔案儲存

#### AWS S3 設定
- [ ] **建立 AWS 帳戶與設定**
  - 註冊 AWS 帳戶 (如果尚未有)
  - 建立 IAM 使用者與存取金鑰
  - 設定適當的權限政策

- [ ] **S3 儲存桶建立**
  - 建立專案專用的 S3 Bucket
  - 設定儲存桶權限與 CORS 規則
  - 配置檔案上傳政策
  - 測試檔案上傳與存取功能

```javascript
// AWS S3 配置範例
const s3Config = {
  bucketName: 'case-management-files',
  region: 'ap-northeast-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
};
```

- [ ] **本地開發環境測試**
  - 安裝 AWS SDK
  - 測試檔案上傳功能
  - 驗證檔案存取權限

---

### ✅ 步驟 0.3: 建立資料庫與 ORM 設定

#### PostgreSQL 資料庫設定
- [ ] **資料庫環境選擇**
  - 本地開發: Docker PostgreSQL 或本機安裝
  - 雲端環境: AWS RDS PostgreSQL

```yaml
# docker-compose.yml for local development
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: case_management
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
volumes:
  postgres_data:
```

- [ ] **ORM 工具設定**
  - 選擇 ORM: TypeORM 或 Prisma
  - 建立資料庫連線配置
  - 設定環境變數管理

#### TypeORM 配置 (如選擇 TypeORM)
```typescript
// ormconfig.ts
export const ormConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'admin',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'case_management',
  entities: ['dist/**/*.entity{.ts,.js}'],
  synchronize: process.env.NODE_ENV !== 'production',
  migrations: ['dist/migrations/*{.ts,.js}'],
  cli: {
    migrationsDir: 'src/migrations',
  },
};
```

---

### ✅ 步驟 0.4: 定義資料庫實體與關係

#### 核心資料實體建立
- [ ] **User 實体定義**

```typescript
// src/entities/user.entity.ts
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password_hash: string;

  @Column({ type: 'enum', enum: ['Clerk', 'Chair', 'Caseworker'] })
  role: string;

  @Column()
  name: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Case, (case_) => case_.created_by)
  created_cases: Case[];

  @OneToMany(() => Case, (case_) => case_.assigned_caseworker)
  assigned_cases: Case[];
}
```

- [ ] **Case 實體定義**

```typescript
// src/entities/case.entity.ts
@Entity('cases')
export class Case {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({ 
    type: 'enum', 
    enum: ['New', 'Pending Review', 'Assigned', 'In Progress', 'Completed', 'Rejected'],
    default: 'New'
  })
  status: string;

  @Column({ 
    type: 'enum', 
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  })
  priority: string;

  @ManyToOne(() => User, (user) => user.created_cases)
  @JoinColumn({ name: 'created_by' })
  created_by: User;

  @ManyToOne(() => User, (user) => user.assigned_cases, { nullable: true })
  @JoinColumn({ name: 'assigned_caseworker' })
  assigned_caseworker: User;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  due_date: Date;

  @OneToMany(() => CaseLog, (log) => log.case)
  logs: CaseLog[];

  @OneToMany(() => CaseAttachment, (attachment) => attachment.case)
  attachments: CaseAttachment[];
}
```

- [ ] **Case_Log 實體定義**

```typescript
// src/entities/case-log.entity.ts
@Entity('case_logs')
export class CaseLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Case, (case_) => case_.logs)
  @JoinColumn({ name: 'case_id' })
  case: Case;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  action: string;

  @Column('text')
  description: string;

  @CreateDateColumn()
  created_at: Date;
}
```

- [ ] **Case_Attachment 實體定義**

```typescript
// src/entities/case-attachment.entity.ts
@Entity('case_attachments')
export class CaseAttachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Case, (case_) => case_.attachments)
  @JoinColumn({ name: 'case_id' })
  case: Case;

  @Column()
  filename: string;

  @Column()
  s3_key: string;

  @Column()
  file_size: number;

  @Column()
  content_type: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploaded_by' })
  uploaded_by: User;

  @CreateDateColumn()
  created_at: Date;
}
```

#### 資料庫遷移
- [ ] **建立初始遷移檔案**
  - 生成資料庫遷移腳本
  - 測試遷移執行
  - 驗證資料表結構

```bash
# TypeORM 遷移指令
npm run migration:generate -- -n InitialSchema
npm run migration:run
```

---

### ✅ 步驟 0.5: 準備測試資料

#### 測試使用者建立
- [ ] **建立種子資料腳本**

```typescript
// src/seeds/user.seed.ts
export const seedUsers = [
  {
    email: 'clerk@example.com',
    password: 'password123',
    role: 'Clerk',
    name: '文書人員 Alice'
  },
  {
    email: 'chair@example.com', 
    password: 'password123',
    role: 'Chair',
    name: '主管 Bob'
  },
  {
    email: 'caseworker1@example.com',
    password: 'password123', 
    role: 'Caseworker',
    name: '工作人員 Carol'
  },
  {
    email: 'caseworker2@example.com',
    password: 'password123',
    role: 'Caseworker', 
    name: '工作人員 David'
  }
];
```

- [ ] **執行種子資料腳本**
  - 建立資料庫種子資料功能
  - 執行測試使用者建立
  - 驗證資料正確性

---

## 🔍 驗收標準

### 技術環境驗收
- [ ] Next.js 開發伺服器正常啟動
- [ ] NestJS API 伺服器正常運行
- [ ] PostgreSQL 資料庫連線成功
- [ ] AWS S3 檔案上傳測試通過

### 資料庫驗收
- [ ] 所有資料表建立完成
- [ ] 實體關係正確設定
- [ ] 測試資料成功載入
- [ ] 基本 CRUD 操作測試通過

### 開發工具驗收
- [ ] Git 版本控制正常
- [ ] ESLint 和 Prettier 設定完成
- [ ] 環境變數管理設定完成
- [ ] Docker 環境 (如使用) 正常運行

---

## 📝 交付產出

1. **程式碼儲存庫**
   - 前端 Next.js 專案
   - 後端 NestJS 專案
   - 資料庫遷移檔案

2. **環境設定文件**
   - 開發環境設定指南
   - 環境變數範例檔案
   - Docker 設定檔案

3. **資料庫文件**
   - ERD 圖表
   - 資料表結構文件
   - 種子資料腳本

4. **雲端服務設定**
   - AWS S3 設定記錄
   - 存取權限設定文件

---

## ⚠️ 注意事項

### 安全性考量
- 所有敏感資訊 (API 金鑰、密碼) 必須使用環境變數
- 資料庫密碼使用強密碼
- AWS IAM 權限遵循最小權限原則

### 效能考量
- 資料庫索引規劃
- S3 儲存桶區域選擇
- 連線池設定優化

### 維護性考量
- 程式碼註解與文件
- Git commit 規範
- 分支管理策略

---

**下一階段**: [階段 1: 核心 MVP 開發](./phase_1_mvp_core.md)