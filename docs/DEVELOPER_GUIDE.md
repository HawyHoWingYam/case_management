# 開發者指引 / Developer Guide

## 目錄 / Table of Contents

1. [環境設置](#環境設置--environment-setup)
2. [開發流程](#開發流程--development-workflow)
3. [代碼標準](#代碼標準--code-standards)
4. [測試指引](#測試指引--testing-guidelines)
5. [安全準則](#安全準則--security-guidelines)
6. [性能準則](#性能準則--performance-guidelines)
7. [部署流程](#部署流程--deployment-process)
8. [故障排除](#故障排除--troubleshooting)

---

## 環境設置 / Environment Setup

### 系統需求 / System Requirements

- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0
- **Docker**: >= 20.10.0
- **Docker Compose**: >= 2.0.0
- **Git**: >= 2.30.0

### 開發環境配置 / Development Environment Configuration

```bash
# 1. 克隆專案
git clone <repository-url>
cd case-management

# 2. 安裝依賴
npm run install:all

# 3. 設置環境變數
cp .env.example .env
# 編輯 .env 文件以配置您的環境變數

# 4. 啟動開發服務
npm run docker:dev

# 5. 等待服務啟動後，運行遷移和種子數據
npm run db:migrate
npm run db:seed
```

### IDE 配置 / IDE Configuration

#### VS Code 推薦設置

安裝以下擴展：

```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-jest",
    "ms-vscode.vscode-eslint",
    "github.copilot",
    "ms-playwright.playwright"
  ]
}
```

workspace 設置 (`.vscode/settings.json`):

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "jest.autoRun": "watch"
}
```

---

## 開發流程 / Development Workflow

### Git 工作流程 / Git Workflow

我們使用 **GitFlow** 工作流程：

```
main (生產分支)
├── develop (開發分支)
    ├── feature/feature-name (功能分支)
    ├── bugfix/bug-description (錯誤修復分支)
    ├── release/v1.x.x (發佈分支)
    └── hotfix/critical-fix (熱修復分支)
```

### 分支命名規範 / Branch Naming Convention

- **功能分支**: `feature/JIRA-123-user-authentication`
- **錯誤修復**: `bugfix/JIRA-456-login-error`
- **發佈分支**: `release/v1.2.0`
- **熱修復**: `hotfix/v1.2.1-security-patch`

### 提交訊息規範 / Commit Message Convention

我們使用 [Conventional Commits](https://www.conventionalcommits.org/) 規範：

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

#### 類型 (Types):

- **feat**: 新功能
- **fix**: 錯誤修復
- **docs**: 文檔更改
- **style**: 代碼格式化 (不影響代碼邏輯)
- **refactor**: 重構 (既不修復錯誤也不添加功能)
- **perf**: 性能改進
- **test**: 添加或修改測試
- **build**: 構建系統或外部依賴項的更改
- **ci**: CI 配置文件和腳本的更改
- **chore**: 其他更改
- **security**: 安全相關修復

#### 示例:

```bash
feat(auth): add OAuth2 login support

- Implement Google OAuth2 integration
- Add user profile sync from OAuth provider
- Update authentication middleware

Closes #123
```

### Pull Request 流程 / Pull Request Process

1. **創建分支**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/new-feature
   ```

2. **開發和提交**
   ```bash
   # 確保代碼通過所有檢查
   npm run lint
   npm run test
   npm run type-check
   
   git add .
   git commit -m "feat: add new feature"
   ```

3. **推送和創建 PR**
   ```bash
   git push origin feature/new-feature
   # 在 GitHub 上創建 Pull Request
   ```

4. **代碼審查**
   - 至少需要 1 位審查者批准
   - 所有 CI 檢查必須通過
   - 解決所有審查意見

5. **合併**
   - 使用 "Squash and merge" 合併功能分支
   - 刪除已合併的分支

---

## 代碼標準 / Code Standards

### TypeScript 編碼標準

#### 命名規範

```typescript
// 類別和介面 - PascalCase
class UserService {}
interface ApiResponse {}
type UserRole = 'admin' | 'user';

// 函數和變數 - camelCase
const getUserProfile = async (userId: string) => {};
const isAuthenticated = true;

// 常數 - SCREAMING_SNAKE_CASE
const API_BASE_URL = 'https://api.example.com';
const MAX_RETRY_ATTEMPTS = 3;

// 文件名 - kebab-case
// user-service.ts
// api-client.ts
```

#### 函數設計原則

```typescript
// ✅ 好的做法
interface CreateUserParams {
  email: string;
  password: string;
  role?: UserRole;
}

const createUser = async (params: CreateUserParams): Promise<User> => {
  // 單一職責，清晰的參數類型
};

// ❌ 避免的做法
const createUser = async (email: any, password: any, role?: any) => {
  // 避免使用 any，參數太多
};
```

#### 錯誤處理

```typescript
// ✅ 使用自定義錯誤類型
class ValidationError extends Error {
  constructor(message: string, public field: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// ✅ 適當的錯誤處理
const processUser = async (userData: unknown): Promise<User> => {
  try {
    const validatedData = await validateUserData(userData);
    return await userService.create(validatedData);
  } catch (error) {
    if (error instanceof ValidationError) {
      logger.warn(`Validation failed for field: ${error.field}`);
      throw error;
    }
    
    logger.error('Unexpected error in processUser', { error });
    throw new Error('Failed to process user');
  }
};
```

### React 組件標準

#### 組件結構

```typescript
// ✅ 功能組件使用箭頭函數
interface UserCardProps {
  user: User;
  onEdit?: (user: User) => void;
  className?: string;
}

export const UserCard: React.FC<UserCardProps> = ({
  user,
  onEdit,
  className = '',
}) => {
  // Hooks 在頂部
  const [isEditing, setIsEditing] = useState(false);
  const { data, error, isLoading } = useUserQuery(user.id);
  
  // 事件處理函數
  const handleEdit = useCallback(() => {
    setIsEditing(true);
    onEdit?.(user);
  }, [user, onEdit]);
  
  // 早期返回處理加載和錯誤狀態
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  // 主要渲染邏輯
  return (
    <div className={cn('user-card', className)}>
      <h3>{user.name}</h3>
      <button onClick={handleEdit}>Edit</button>
    </div>
  );
};
```

#### Hooks 使用指引

```typescript
// ✅ 自定義 Hook
const useUserPermissions = (userId: string) => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const userPermissions = await api.getUserPermissions(userId);
        setPermissions(userPermissions);
      } catch (error) {
        console.error('Failed to fetch permissions:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPermissions();
  }, [userId]);
  
  return { permissions, isLoading };
};
```

### NestJS 後端標準

#### 控制器設計

```typescript
@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  
  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  async findAll(
    @Query() query: GetUsersQueryDto,
  ): Promise<PaginatedResponse<User>> {
    return this.usersService.findAll(query);
  }
  
  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() currentUser: User,
  ): Promise<User> {
    return this.usersService.create(createUserDto, currentUser);
  }
}
```

#### 服務層設計

```typescript
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly logger: Logger,
  ) {}
  
  async findAll(query: GetUsersQueryDto): Promise<PaginatedResponse<User>> {
    try {
      const { page = 1, limit = 10, search } = query;
      
      const queryBuilder = this.userRepository.createQueryBuilder('user');
      
      if (search) {
        queryBuilder.where(
          'user.name ILIKE :search OR user.email ILIKE :search',
          { search: `%${search}%` },
        );
      }
      
      const [users, total] = await queryBuilder
        .take(limit)
        .skip((page - 1) * limit)
        .getManyAndCount();
      
      return {
        data: users,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      this.logger.error('Failed to fetch users', error);
      throw new InternalServerErrorException('Failed to fetch users');
    }
  }
}
```

---

## 測試指引 / Testing Guidelines

### 測試金字塔

```
    E2E Tests (10%)
      ↗ ↖
Integration Tests (20%)
      ↗ ↖
  Unit Tests (70%)
```

### 單元測試 (Unit Tests)

#### Frontend 測試 (Jest + React Testing Library)

```typescript
// user-card.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { UserCard } from './UserCard';

const mockUser = {
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
};

describe('UserCard', () => {
  it('renders user information correctly', () => {
    render(<UserCard user={mockUser} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });
  
  it('calls onEdit when edit button is clicked', () => {
    const onEdit = jest.fn();
    render(<UserCard user={mockUser} onEdit={onEdit} />);
    
    fireEvent.click(screen.getByText('Edit'));
    
    expect(onEdit).toHaveBeenCalledWith(mockUser);
  });
});
```

#### Backend 測試 (Jest + NestJS Testing)

```typescript
// users.service.spec.ts
describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;
  
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findAndCount: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();
    
    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });
  
  describe('findAll', () => {
    it('should return paginated users', async () => {
      const mockUsers = [mockUser];
      const mockCount = 1;
      
      jest.spyOn(repository, 'findAndCount').mockResolvedValue([mockUsers, mockCount]);
      
      const result = await service.findAll({ page: 1, limit: 10 });
      
      expect(result.data).toEqual(mockUsers);
      expect(result.total).toBe(mockCount);
    });
  });
});
```

### 整合測試 (Integration Tests)

```typescript
// auth.integration.spec.ts
describe('Authentication (e2e)', () => {
  let app: INestApplication;
  
  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    
    app = moduleFixture.createNestApplication();
    await app.init();
  });
  
  it('/auth/login (POST)', async () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };
    
    return request(app.getHttpServer())
      .post('/auth/login')
      .send(loginDto)
      .expect(201)
      .expect((res) => {
        expect(res.body.accessToken).toBeDefined();
        expect(res.body.user.email).toBe(loginDto.email);
      });
  });
});
```

### E2E 測試 (Cypress)

```typescript
// auth.cy.ts
describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.visit('/login');
  });
  
  it('should login successfully with valid credentials', () => {
    cy.get('[data-testid=email-input]').type('test@example.com');
    cy.get('[data-testid=password-input]').type('password123');
    cy.get('[data-testid=login-button]').click();
    
    cy.url().should('include', '/dashboard');
    cy.get('[data-testid=user-menu]').should('contain', 'test@example.com');
  });
  
  it('should show error message with invalid credentials', () => {
    cy.get('[data-testid=email-input]').type('invalid@example.com');
    cy.get('[data-testid=password-input]').type('wrongpassword');
    cy.get('[data-testid=login-button]').click();
    
    cy.get('[data-testid=error-message]').should('be.visible');
    cy.url().should('include', '/login');
  });
});
```

### 測試覆蓋率要求

- **單元測試**: >= 90%
- **整合測試**: >= 80%
- **E2E 測試**: 覆蓋主要用戶流程

### 測試最佳實踐

1. **AAA 模式**: Arrange, Act, Assert
2. **測試命名**: 描述性命名，說明測試場景和預期結果
3. **測試隔離**: 每個測試應該獨立運行
4. **模擬外部依賴**: 使用 mock 來隔離被測試的單位
5. **測試數據**: 使用工廠模式創建測試數據

---

## 安全準則 / Security Guidelines

### 認證和授權

```typescript
// ✅ 使用強類型的權限檢查
enum Permission {
  READ_USERS = 'users:read',
  WRITE_USERS = 'users:write',
  DELETE_USERS = 'users:delete',
}

@UseGuards(PermissionGuard(Permission.READ_USERS))
async getUsers() {
  // 只有具有 READ_USERS 權限的用戶才能訪問
}
```

### 輸入驗證

```typescript
// ✅ 使用 DTO 和驗證裝飾器
export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
  
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  password: string;
  
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
```

### 敏感數據處理

```typescript
// ✅ 不在日誌中記錄敏感信息
const safeUser = {
  id: user.id,
  email: user.email,
  // 不包含密碼或其他敏感信息
};
logger.info('User created', { user: safeUser });

// ✅ 使用環境變數存儲敏感配置
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error('JWT_SECRET is required');
}
```

### SQL 注入防護

```typescript
// ✅ 使用參數化查詢
const users = await this.userRepository
  .createQueryBuilder('user')
  .where('user.email = :email', { email: userEmail })
  .getMany();

// ❌ 避免字符串拼接
// const query = `SELECT * FROM users WHERE email = '${userEmail}'`; // 危險!
```

---

## 性能準則 / Performance Guidelines

### 前端性能

#### 代碼分割

```typescript
// ✅ 使用動態導入進行代碼分割
const LazyComponent = React.lazy(() => import('./components/LazyComponent'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <LazyComponent />
    </Suspense>
  );
}
```

#### 圖片優化

```typescript
// ✅ 使用 Next.js Image 組件
import Image from 'next/image';

<Image
  src="/profile.jpg"
  alt="User profile"
  width={200}
  height={200}
  priority={false}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

### 後端性能

#### 數據庫查詢優化

```typescript
// ✅ 使用索引和適當的查詢
@Entity()
export class User {
  @Index()
  @Column({ unique: true })
  email: string;
  
  @Index()
  @Column()
  status: UserStatus;
}

// ✅ 使用 select 限制返回字段
const users = await this.userRepository
  .createQueryBuilder('user')
  .select(['user.id', 'user.email', 'user.status'])
  .where('user.status = :status', { status: 'active' })
  .getMany();
```

#### 緩存策略

```typescript
// ✅ 使用 Redis 緩存
@Injectable()
export class CacheService {
  constructor(@Inject('REDIS') private redis: Redis) {}
  
  async get<T>(key: string): Promise<T | null> {
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }
  
  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }
}
```

### 性能監控

```typescript
// ✅ 添加性能監控
import { performance } from 'perf_hooks';

const measurePerformance = (target, propertyName, descriptor) => {
  const originalMethod = descriptor.value;
  
  descriptor.value = async function (...args) {
    const start = performance.now();
    const result = await originalMethod.apply(this, args);
    const end = performance.now();
    
    const duration = end - start;
    if (duration > 1000) { // 超過 1 秒的操作
      logger.warn(`Slow operation detected: ${propertyName} took ${duration}ms`);
    }
    
    return result;
  };
  
  return descriptor;
};
```

---

## 部署流程 / Deployment Process

### 環境配置

- **Development**: 本地開發環境
- **Staging**: 測試環境，模擬生產環境
- **Production**: 生產環境

### CI/CD 流程

1. **代碼推送** → **自動化測試** → **安全掃描** → **構建** → **部署到 Staging** → **手動驗證** → **部署到 Production**

### 部署檢查清單

- [ ] 所有測試通過
- [ ] 安全掃描無嚴重問題
- [ ] 性能測試符合要求
- [ ] 數據庫遷移已準備
- [ ] 環境變數已配置
- [ ] 監控和日誌配置正確
- [ ] 回滾計劃已準備

---

## 故障排除 / Troubleshooting

### 常見問題

#### 開發環境問題

**問題**: Docker 容器無法啟動
```bash
# 解決方案
docker-compose down -v
docker system prune -f
npm run docker:dev
```

**問題**: 端口被占用
```bash
# 查找占用端口的進程
lsof -i :3000
# 終止進程
kill -9 <PID>
```

#### 數據庫問題

**問題**: 連接數據庫失敗
```bash
# 檢查數據庫狀態
docker-compose ps
# 重啟數據庫服務
docker-compose restart postgres
```

### 調試工具

- **Chrome DevTools**: 前端調試
- **VS Code Debugger**: Node.js 調試
- **Database Client**: 數據庫查詢和管理
- **Postman**: API 測試

### 日誌分析

```typescript
// ✅ 結構化日誌
logger.info('User login attempt', {
  userId: user.id,
  email: user.email,
  timestamp: new Date().toISOString(),
  ipAddress: req.ip,
  userAgent: req.get('User-Agent'),
});
```

---

## 資源和參考

### 官方文檔
- [Next.js Documentation](https://nextjs.org/docs)
- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### 工具和庫
- [Prettier](https://prettier.io/)
- [ESLint](https://eslint.org/)
- [Jest](https://jestjs.io/)
- [Cypress](https://www.cypress.io/)

### 最佳實踐
- [Clean Code](https://github.com/ryanmcdermott/clean-code-javascript)
- [React Best Practices](https://react.dev/learn)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

*此文檔會持續更新，請定期檢查最新版本。如有問題或建議，請創建 Issue 或聯繫開發團隊。*