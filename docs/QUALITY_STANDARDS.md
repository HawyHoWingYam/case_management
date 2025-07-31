# 品質標準文檔 / Quality Standards Documentation

## 概述 / Overview

本文檔定義了 Case Management System 專案的品質標準和要求。所有團隊成員都必須遵循這些標準，以確保代碼品質、安全性和可維護性。

## 目錄 / Table of Contents

1. [品質門檻](#品質門檻--quality-gates)
2. [代碼品質標準](#代碼品質標準--code-quality-standards)
3. [測試標準](#測試標準--testing-standards)
4. [安全標準](#安全標準--security-standards)
5. [性能標準](#性能標準--performance-standards)
6. [文檔標準](#文檔標準--documentation-standards)
7. [審查流程](#審查流程--review-process)
8. [工具和自動化](#工具和自動化--tools-and-automation)

---

## 品質門檻 / Quality Gates

### 必須通過的檢查項目

所有代碼提交必須通過以下品質門檻：

#### 📋 提交前檢查 (Pre-commit)
- [ ] **代碼格式化**: Prettier 格式化通過
- [ ] **代碼風格**: ESLint 檢查通過，無錯誤
- [ ] **類型檢查**: TypeScript 編譯無錯誤
- [ ] **單元測試**: 相關測試通過
- [ ] **提交訊息**: 符合 Conventional Commits 規範

#### 🚀 推送前檢查 (Pre-push)
- [ ] **完整測試套件**: 所有測試通過
- [ ] **安全掃描**: 無高風險安全漏洞
- [ ] **構建驗證**: 應用程式可以成功構建

#### 🔍 Pull Request 檢查
- [ ] **代碼審查**: 至少 1 位審查者批准
- [ ] **CI/CD 流水線**: 所有自動化檢查通過
- [ ] **測試覆蓋率**: 維持 >= 90% 覆蓋率
- [ ] **性能測試**: 無性能回歸
- [ ] **安全掃描**: 安全檢查通過
- [ ] **文檔更新**: 相關文檔已更新

---

## 代碼品質標準 / Code Quality Standards

### 🎯 品質指標

| 指標 | 目標值 | 警告值 | 說明 |
|------|--------|--------|------|
| 代碼複雜度 (Cyclomatic) | ≤ 10 | > 8 | 函數複雜度 |
| 函數長度 | ≤ 50 行 | > 40 行 | 單一函數最大行數 |
| 文件長度 | ≤ 500 行 | > 400 行 | 單一文件最大行數 |
| 參數數量 | ≤ 4 個 | > 3 個 | 函數參數最大數量 |
| 嵌套深度 | ≤ 3 層 | > 2 層 | 代碼嵌套層次 |

### 📝 命名規範

#### TypeScript/JavaScript

```typescript
// ✅ 正確示例
class UserService {
  private readonly MAX_RETRY_ATTEMPTS = 3;
  
  async createUser(userData: CreateUserRequest): Promise<User> {
    const isValidEmail = this.validateEmail(userData.email);
    // ...
  }
}

// ❌ 錯誤示例
class usersvc {
  private max = 3;
  
  async create(data: any): Promise<any> {
    const valid = this.check(data.email);
    // ...
  }
}
```

#### React 組件

```typescript
// ✅ 正確示例
interface UserProfileProps {
  user: User;
  onEdit?: (user: User) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user, onEdit }) => {
  const [isEditing, setIsEditing] = useState(false);
  
  const handleEditClick = useCallback(() => {
    setIsEditing(true);
    onEdit?.(user);
  }, [user, onEdit]);
  
  return (
    <div data-testid="user-profile">
      {/* ... */}
    </div>
  );
};
```

### 🏗️ 架構原則

#### SOLID 原則

1. **Single Responsibility Principle (SRP)**
   ```typescript
   // ✅ 單一職責
   class EmailValidator {
     validate(email: string): boolean {
       return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
     }
   }
   
   class EmailSender {
     async send(to: string, subject: string, body: string): Promise<void> {
       // 發送邏輯
     }
   }
   ```

2. **Open/Closed Principle (OCP)**
   ```typescript
   // ✅ 對擴展開放，對修改關閉
   abstract class NotificationStrategy {
     abstract send(message: string, recipient: string): Promise<void>;
   }
   
   class EmailNotification extends NotificationStrategy {
     async send(message: string, recipient: string): Promise<void> {
       // Email 發送實現
     }
   }
   
   class SMSNotification extends NotificationStrategy {
     async send(message: string, recipient: string): Promise<void> {
       // SMS 發送實現
     }
   }
   ```

3. **Dependency Inversion Principle (DIP)**
   ```typescript
   // ✅ 依賴抽象而非具體實現
   interface IUserRepository {
     findById(id: string): Promise<User | null>;
     save(user: User): Promise<User>;
   }
   
   class UserService {
     constructor(private userRepository: IUserRepository) {}
     
     async getUser(id: string): Promise<User> {
       const user = await this.userRepository.findById(id);
       if (!user) {
         throw new Error('User not found');
       }
       return user;
     }
   }
   ```

### 🚫 代碼禁忌

```typescript
// ❌ 絕對禁止
const data: any = getData(); // 禁止使用 any
eval('dangerous code'); // 禁止使用 eval
var globalVar = 'bad'; // 禁止使用 var

// ❌ 避免使用
function processData(a, b, c, d, e, f) {} // 參數太多
if (condition) if (another) if (third) {} // 過度嵌套

// ❌ 不良實踐
class GodClass {
  // 包含太多職責的巨型類
}

function doEverything() {
  // 包含太多邏輯的巨型函數
}
```

---

## 測試標準 / Testing Standards

### 📊 測試覆蓋率要求

| 層級 | 最小覆蓋率 | 目標覆蓋率 | 說明 |
|------|------------|------------|------|
| 單元測試 | 90% | 95% | 行覆蓋率 |
| 整合測試 | 80% | 90% | API 端點覆蓋 |
| E2E 測試 | 70% | 80% | 關鍵用戶流程 |
| 分支覆蓋率 | 85% | 90% | 所有分支邏輯 |

### 🧪 測試分類和標準

#### 單元測試 (Unit Tests)

```typescript
// ✅ 良好的單元測試示例
describe('UserService', () => {
  let userService: UserService;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  
  beforeEach(() => {
    mockUserRepository = {
      findById: jest.fn(),
      save: jest.fn(),
    };
    userService = new UserService(mockUserRepository);
  });
  
  describe('getUser', () => {
    it('should return user when user exists', async () => {
      // Arrange
      const userId = 'user-123';
      const expectedUser = { id: userId, name: 'John Doe' };
      mockUserRepository.findById.mockResolvedValue(expectedUser);
      
      // Act
      const result = await userService.getUser(userId);
      
      // Assert
      expect(result).toEqual(expectedUser);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
    });
    
    it('should throw error when user does not exist', async () => {
      // Arrange
      const userId = 'non-existent';
      mockUserRepository.findById.mockResolvedValue(null);
      
      // Act & Assert
      await expect(userService.getUser(userId))
        .rejects
        .toThrow('User not found');
    });
  });
});
```

#### 整合測試 (Integration Tests)

```typescript
// ✅ API 整合測試示例
describe('Users API Integration', () => {
  let app: INestApplication;
  let authToken: string;
  
  beforeAll(async () => {
    app = await createTestApp();
    authToken = await getAuthToken(app);
  });
  
  afterAll(async () => {
    await app.close();
  });
  
  describe('GET /users', () => {
    it('should return paginated users for authenticated user', async () => {
      const response = await request(app.getHttpServer())
        .get('/users?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body).toMatchObject({
        data: expect.any(Array),
        total: expect.any(Number),
        page: 1,
        limit: 10,
      });
    });
    
    it('should return 401 for unauthenticated requests', async () => {
      await request(app.getHttpServer())
        .get('/users')
        .expect(401);
    });
  });
});
```

#### E2E 測試 (End-to-End Tests)

```typescript
// ✅ E2E 測試示例
describe('User Management Flow', () => {
  beforeEach(() => {
    cy.task('db:seed');
    cy.login('admin@example.com', 'password123');
  });
  
  it('should complete full user management workflow', () => {
    // Navigate to users page
    cy.visit('/users');
    cy.get('[data-testid=users-table]').should('be.visible');
    
    // Create new user
    cy.get('[data-testid=create-user-button]').click();
    cy.get('[data-testid=user-form]').should('be.visible');
    
    cy.get('[data-testid=name-input]').type('Jane Doe');
    cy.get('[data-testid=email-input]').type('jane@example.com');
    cy.get('[data-testid=role-select]').select('user');
    
    cy.get('[data-testid=submit-button]').click();
    
    // Verify user was created
    cy.get('[data-testid=success-message]').should('contain', 'User created successfully');
    cy.get('[data-testid=users-table]').should('contain', 'jane@example.com');
    
    // Edit user
    cy.get('[data-testid=user-row-jane@example.com] [data-testid=edit-button]').click();
    cy.get('[data-testid=name-input]').clear().type('Jane Smith');
    cy.get('[data-testid=submit-button]').click();
    
    // Verify user was updated
    cy.get('[data-testid=users-table]').should('contain', 'Jane Smith');
  });
});
```

### 🎯 測試最佳實踐

#### 測試結構 (AAA Pattern)

```typescript
// ✅ Arrange-Act-Assert 模式
it('should calculate total price with discount', () => {
  // Arrange - 準備測試數據
  const orderItems = [
    { price: 100, quantity: 2 },
    { price: 50, quantity: 1 },
  ];
  const discountPercentage = 10;
  
  // Act - 執行被測試的操作
  const totalPrice = calculateTotal(orderItems, discountPercentage);
  
  // Assert - 驗證結果
  expect(totalPrice).toBe(225); // (200 + 50) * 0.9
});
```

#### 測試數據管理

```typescript
// ✅ 使用工廠函數創建測試數據
const createTestUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-123',
  name: 'Test User',
  email: 'test@example.com',
  role: 'user',
  createdAt: new Date(),
  ...overrides,
});

// 使用
const adminUser = createTestUser({ role: 'admin' });
const newUser = createTestUser({ id: 'user-456', name: 'New User' });
```

---

## 安全標準 / Security Standards

### 🔒 安全要求

#### 認證和授權

```typescript
// ✅ 強制認證檢查
@Controller('sensitive-data')
@UseGuards(AuthGuard, RolesGuard)
export class SensitiveDataController {
  @Get()
  @Roles('admin', 'manager')
  async getSensitiveData(@CurrentUser() user: User) {
    // 只有管理員和經理可以訪問
    return this.sensitiveDataService.getData(user);
  }
}
```

#### 輸入驗證

```typescript
// ✅ 嚴格的輸入驗證
export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }) => value.toLowerCase().trim())
  email: string;
  
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must contain uppercase, lowercase, number and special char',
  })
  password: string;
  
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Matches(/^[a-zA-Z\s]+$/, { message: 'Name can only contain letters and spaces' })
  name?: string;
}
```

#### 安全標頭

```typescript
// ✅ 安全標頭配置
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));
```

### 🚨 安全檢查清單

#### 代碼審查安全檢查

- [ ] **SQL 注入防護**: 使用參數化查詢或 ORM
- [ ] **XSS 防護**: 適當的輸入消毒和輸出編碼
- [ ] **CSRF 防護**: 實施 CSRF token
- [ ] **認證檢查**: 所有敏感操作都需要認證
- [ ] **授權檢查**: 實施適當的權限控制
- [ ] **敏感資料**: 不在日誌或錯誤訊息中暴露
- [ ] **密碼安全**: 使用強哈希算法
- [ ] **會話管理**: 安全的會話配置

#### 依賴項安全

```bash
# 定期運行安全掃描
npm audit
npm audit fix

# 使用 Snyk 進行更深入的掃描
snyk test
snyk monitor
```

---

## 性能標準 / Performance Standards

### ⚡ 性能指標

#### 前端性能預算

| 指標 | 目標值 | 最大值 | 說明 |
|------|--------|--------|------|
| First Contentful Paint | < 1.5s | < 2s | 首次內容繪製 |
| Largest Contentful Paint | < 2.5s | < 3s | 最大內容繪製 |
| Cumulative Layout Shift | < 0.1 | < 0.15 | 累積佈局偏移 |
| Total Blocking Time | < 200ms | < 300ms | 總阻塞時間 |
| Bundle Size (JS) | < 300KB | < 400KB | JavaScript 總大小 |
| Bundle Size (CSS) | < 100KB | < 150KB | CSS 總大小 |

#### 後端性能預算

| 指標 | 目標值 | 最大值 | 說明 |
|------|--------|--------|------|
| API 響應時間 (P95) | < 500ms | < 1s | 95% 請求響應時間 |
| 數據庫查詢時間 (P95) | < 100ms | < 200ms | 95% 查詢響應時間 |
| 記憶體使用率 | < 70% | < 80% | 系統記憶體使用 |
| CPU 使用率 | < 60% | < 70% | 系統 CPU 使用 |
| 錯誤率 | < 0.1% | < 1% | 請求錯誤率 |

### 🏃‍♀️ 性能優化要求

#### 前端優化

```typescript
// ✅ 代碼分割
const LazyDashboard = React.lazy(() => 
  import('./components/Dashboard').then(module => ({
    default: module.Dashboard,
  }))
);

// ✅ 記憶化昂貴計算
const ExpensiveComponent: React.FC<Props> = ({ data, filters }) => {
  const processedData = useMemo(() => {
    return expensiveProcessing(data, filters);
  }, [data, filters]);
  
  return <div>{processedData}</div>;
};

// ✅ 虛擬滾動大量數據
import { FixedSizeList as List } from 'react-window';

const VirtualizedList: React.FC<{ items: Item[] }> = ({ items }) => (
  <List
    height={600}
    itemCount={items.length}
    itemSize={50}
    itemData={items}
  >
    {Row}
  </List>
);
```

#### 後端優化

```typescript
// ✅ 數據庫查詢優化
@Entity()
@Index(['status', 'createdAt']) // 複合索引
export class Case {
  @Index() // 單一索引
  @Column()
  assigneeId: string;
  
  @Column()
  status: CaseStatus;
  
  @CreateDateColumn()
  createdAt: Date;
}

// ✅ 緩存策略
@Injectable()
export class CaseService {
  @Cacheable('cases', 300) // 緩存 5 分鐘
  async findAll(query: GetCasesQuery): Promise<Case[]> {
    return this.caseRepository.find({
      where: query,
      relations: ['assignee', 'client'],
    });
  }
  
  @CacheEvict(['cases'])
  async create(caseData: CreateCaseDto): Promise<Case> {
    return this.caseRepository.save(caseData);
  }
}
```

---

## 文檔標準 / Documentation Standards

### 📚 文檔要求

#### API 文檔

```typescript
// ✅ 完整的 API 文檔
/**
 * Creates a new user in the system
 * 
 * @summary Create User
 * @description Creates a new user with the provided information.
 * Requires admin privileges.
 * 
 * @param createUserDto - User creation data
 * @returns Promise<User> - The created user object
 * 
 * @throws {ValidationException} When input data is invalid
 * @throws {ConflictException} When email already exists
 * @throws {ForbiddenException} When user lacks admin privileges
 * 
 * @example
 * ```typescript
 * const newUser = await userService.create({
 *   email: 'john@example.com',
 *   name: 'John Doe',
 *   role: 'user'
 * });
 * ```
 */
@ApiOperation({ summary: 'Create a new user' })
@ApiResponse({ status: 201, description: 'User created successfully', type: User })
@ApiResponse({ status: 400, description: 'Invalid input data' })
@ApiResponse({ status: 409, description: 'Email already exists' })
@Post()
async create(@Body() createUserDto: CreateUserDto): Promise<User> {
  return this.userService.create(createUserDto);
}
```

#### 代碼註釋

```typescript
// ✅ 有用的註釋
interface PaymentProcessor {
  /**
   * Processes a payment using the configured payment gateway
   * 
   * @param amount - Payment amount in cents (to avoid floating point issues)
   * @param currency - ISO 4217 currency code (e.g., 'USD', 'EUR')
   * @param paymentMethod - Payment method details
   * @returns Payment result with transaction ID
   * 
   * @throws {PaymentError} When payment fails or is declined
   */
  processPayment(
    amount: number,
    currency: string,
    paymentMethod: PaymentMethod
  ): Promise<PaymentResult>;
}

class OrderService {
  /**
   * Calculates order total including taxes and discounts
   * 
   * Business rules:
   * - Discounts are applied before tax calculation
   * - Tax rate varies by customer location
   * - Free shipping for orders over $100
   */
  private calculateTotal(order: Order): number {
    let subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    
    // Apply discount if eligible
    if (order.discountCode && this.isValidDiscount(order.discountCode)) {
      const discount = this.getDiscountAmount(order.discountCode, subtotal);
      subtotal -= discount;
    }
    
    // Calculate tax based on shipping address
    const tax = this.calculateTax(subtotal, order.shippingAddress);
    
    // Add shipping cost (free for orders over $100)
    const shipping = subtotal >= 100 ? 0 : this.getShippingCost(order.shippingAddress);
    
    return subtotal + tax + shipping;
  }
}
```

### 📝 README 要求

每個模組和重要組件都應該有完整的 README，包含：

- 目的和功能描述
- 安裝和設置說明
- 使用示例
- API 參考
- 貢獻指南
- 授權信息

---

## 審查流程 / Review Process

### 👥 代碼審查標準

#### 審查者職責

1. **功能性審查**
   - 代碼是否實現了預期功能
   - 邊界條件和錯誤處理是否完整
   - 業務邏輯是否正確

2. **代碼品質審查**
   - 代碼可讀性和可維護性
   - 遵循編碼標準和最佳實踐
   - 適當的抽象和設計模式

3. **安全性審查**
   - 輸入驗證和消毒
   - 認證和授權檢查
   - 敏感資料處理

4. **性能審查**
   - 潛在的性能瓶頸
   - 資源使用效率
   - 可擴展性考慮

#### 審查清單

**功能性 (Functionality)**
- [ ] 代碼實現了 PR 描述中的所有需求
- [ ] 邊界條件和異常情況得到適當處理
- [ ] 新功能不會破壞現有功能

**可讀性 (Readability)**
- [ ] 代碼清晰易懂，變數和函數命名恰當
- [ ] 複雜邏輯有適當的註釋說明
- [ ] 代碼結構良好，職責分離清晰

**可維護性 (Maintainability)**
- [ ] 代碼遵循 DRY 原則，避免重複
- [ ] 函數和類別職責單一
- [ ] 易於擴展和修改

**測試 (Testing)**
- [ ] 新功能有對應的測試
- [ ] 測試覆蓋率符合要求
- [ ] 測試案例涵蓋主要路徑和邊界條件

**安全性 (Security)**
- [ ] 輸入數據得到適當驗證
- [ ] 敏感操作有適當的權限檢查
- [ ] 無明顯的安全漏洞

**性能 (Performance)**
- [ ] 無明顯的性能問題
- [ ] 數據庫查詢效率良好
- [ ] 資源使用合理

### 🔄 審查流程

1. **提交 PR** - 開發者創建 Pull Request
2. **自動檢查** - CI/CD 系統運行自動化檢查
3. **分配審查者** - 系統自動分配或手動指定審查者
4. **代碼審查** - 審查者進行全面代碼審查
5. **討論和修改** - 基於審查意見進行討論和修改
6. **最終批准** - 所有問題解決後獲得批准
7. **合併代碼** - 合併到目標分支

---

## 工具和自動化 / Tools and Automation

### 🛠️ 品質工具配置

#### ESLint 配置重點

```javascript
// .eslintrc.js
module.exports = {
  rules: {
    // 代碼品質
    'complexity': ['error', 10],
    'max-lines': ['error', 500],
    'max-lines-per-function': ['error', 50],
    'max-params': ['error', 4],
    'max-depth': ['error', 3],
    
    // TypeScript 嚴格性
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-unused-vars': 'error',
    
    // 安全性
    'security/detect-object-injection': 'error',
    'security/detect-unsafe-regex': 'error',
    
    // 最佳實踐
    'prefer-const': 'error',
    'no-var': 'error',
    'eqeqeq': 'error',
  },
};
```

#### Jest 測試配置

```javascript
// jest.config.js
module.exports = {
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/index.ts', // 通常只是匯出文件
  ],
};
```

### 📊 品質監控

#### SonarQube 品質門檻

```yaml
# sonar-project.properties
sonar.qualitygate.wait=true

# 品質門檻設置
sonar.coverage.minimus=90
sonar.duplicated_lines_density.max=3
sonar.maintainability_rating.max=A
sonar.reliability_rating.max=A
sonar.security_rating.max=A
```

#### 持續監控指標

- **技術債務比率**: < 5%
- **代碼異味**: 0 個
- **安全熱點**: 0 個
- **可靠性評級**: A
- **安全評級**: A
- **可維護性評級**: A

---

## 違規處理 / Violation Handling

### ⚠️ 違規分類

#### 嚴重違規 (Critical)
- 安全漏洞
- 資料洩露風險
- 系統穩定性威脅

**處理**: 立即阻止合併，必須修復

#### 主要違規 (Major)
- 測試覆蓋率不足
- 性能問題
- 代碼品質問題

**處理**: 必須在合併前修復

#### 次要違規 (Minor)
- 格式化問題
- 命名規範問題
- 文檔缺失

**處理**: 建議修復，可以後續處理

### 🚫 品質債務管理

- **技術債務登記**: 記錄所有已知的品質問題
- **定期清理**: 每季度安排技術債務清理
- **預防措施**: 持續改進流程和工具

---

## 培訓和持續改進 / Training and Continuous Improvement

### 📈 品質培訓計劃

1. **新人培訓**: 品質標準和工具使用
2. **定期工作坊**: 最佳實踐分享
3. **代碼審查培訓**: 提高審查品質
4. **工具培訓**: 新工具和技術的使用

### 🔄 持續改進

- **月度品質報告**: 品質指標趨勢分析
- **回顧會議**: 品質問題根因分析
- **標準更新**: 基於實踐經驗更新標準
- **工具升級**: 保持工具和流程的先進性

---

*本文檔為活文檔，會根據專案發展和最佳實踐的演進持續更新。所有團隊成員都有義務遵循這些標準，並提出改進建議。*