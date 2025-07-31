# 程式碼風格指引 / Code Style Guide

## 概述 / Overview

本文檔定義了 Case Management System 專案的統一程式碼風格標準。遵循一致的程式碼風格有助於提高代碼可讀性、可維護性，並促進團隊協作。

## 目錄 / Table of Contents

1. [通用原則](#通用原則--general-principles)
2. [TypeScript 風格](#typescript-風格--typescript-style)
3. [React 組件風格](#react-組件風格--react-component-style)
4. [NestJS 後端風格](#nestjs-後端風格--nestjs-backend-style)
5. [CSS/Tailwind 風格](#csstailwind-風格--csstailwind-style)
6. [文件組織](#文件組織--file-organization)
7. [命名規範](#命名規範--naming-conventions)
8. [註釋和文檔](#註釋和文檔--comments-and-documentation)
9. [最佳實踐](#最佳實踐--best-practices)
10. [工具配置](#工具配置--tool-configuration)

---

## 通用原則 / General Principles

### 🎯 核心理念

1. **一致性優於個人偏好** - 整個團隊使用統一風格
2. **可讀性第一** - 代碼應該易於理解和維護
3. **簡潔明了** - 避免不必要的複雜性
4. **自文檔化** - 代碼本身應該是最好的文檔
5. **工具輔助** - 使用自動化工具保證風格一致性

### 📏 基本格式化規則

```typescript
// ✅ 正確的格式化
const config = {
  apiUrl: 'https://api.example.com',
  timeout: 5000,
  retries: 3,
};

const users = await Promise.all([
  fetchUser('user-1'),
  fetchUser('user-2'),
  fetchUser('user-3'),
]);

// ❌ 避免的格式化
const config={apiUrl:'https://api.example.com',timeout:5000,retries:3};
const users=await Promise.all([fetchUser('user-1'),fetchUser('user-2'),fetchUser('user-3')]);
```

---

## TypeScript 風格 / TypeScript Style

### 🔧 基本配置

```typescript
// ✅ 檔案頂部匯入順序
// 1. Node.js 內建模組
import { promises as fs } from 'fs';
import path from 'path';

// 2. 第三方套件 (按字母順序)
import axios from 'axios';
import bcrypt from 'bcryptjs';
import { validate } from 'class-validator';

// 3. 內部模組 (按距離排序)
import { DatabaseService } from '@/services/database.service';
import { LoggerService } from '@/services/logger.service';
import { UserEntity } from '../entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
```

### 🏷️ 類型定義

```typescript
// ✅ 介面定義 - PascalCase
interface UserProfile {
  readonly id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

// ✅ 類型別名
type UserRole = 'admin' | 'manager' | 'caseworker' | 'client';
type ApiResponse<T> = {
  data: T;
  message: string;
  success: boolean;
};

// ✅ 泛型約束
interface Repository<T extends { id: string }> {
  findById(id: string): Promise<T | null>;
  save(entity: T): Promise<T>;
  delete(id: string): Promise<void>;
}

// ✅ 聯合類型和交集類型
type CreateUserRequest = Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>;
type UpdateUserRequest = Partial<CreateUserRequest> & { id: string };

// ✅ 條件類型
type NonNullable<T> = T extends null | undefined ? never : T;
type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];
```

### 🎯 函數定義

```typescript
// ✅ 函數簽名 - 明確的參數和返回類型
const createUser = async (
  userData: CreateUserRequest,
  options: CreateUserOptions = {}
): Promise<UserProfile> => {
  const { validateEmail = true, sendWelcomeEmail = false } = options;
  
  if (validateEmail && !isValidEmail(userData.email)) {
    throw new ValidationError('Invalid email format');
  }
  
  const hashedPassword = await bcrypt.hash(userData.password, 12);
  
  const user = await userRepository.save({
    ...userData,
    password: hashedPassword,
    id: generateId(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  
  if (sendWelcomeEmail) {
    await emailService.sendWelcomeEmail(user.email, user.name);
  }
  
  return user;
};

// ✅ 高階函數
const withRetry = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  maxRetries: number = 3
): T => {
  return (async (...args) => {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn(...args);
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        // 指數退避
        await sleep(Math.pow(2, attempt) * 1000);
      }
    }
  }) as T;
};
```

### 🎨 類別定義

```typescript
// ✅ 類別結構順序
class UserService {
  // 1. 靜態屬性
  private static readonly DEFAULT_ROLE: UserRole = 'client';
  
  // 2. 實例屬性
  private readonly logger: LoggerService;
  private readonly userRepository: Repository<UserProfile>;
  private readonly emailService: EmailService;
  
  // 3. 建構子
  constructor(
    logger: LoggerService,
    userRepository: Repository<UserProfile>,
    emailService: EmailService
  ) {
    this.logger = logger;
    this.userRepository = userRepository;
    this.emailService = emailService;
  }
  
  // 4. 靜態方法
  static validateRole(role: string): role is UserRole {
    return ['admin', 'manager', 'caseworker', 'client'].includes(role);
  }
  
  // 5. 公共方法
  async createUser(userData: CreateUserRequest): Promise<UserProfile> {
    this.logger.info('Creating user', { email: userData.email });
    
    await this.validateUserData(userData);
    
    const user = await this.saveUser(userData);
    
    this.logger.info('User created successfully', { userId: user.id });
    
    return user;
  }
  
  async getUserById(id: string): Promise<UserProfile | null> {
    if (!this.isValidId(id)) {
      throw new ValidationError('Invalid user ID format');
    }
    
    return this.userRepository.findById(id);
  }
  
  // 6. 私有方法
  private async validateUserData(userData: CreateUserRequest): Promise<void> {
    const existingUser = await this.userRepository.findByEmail(userData.email);
    
    if (existingUser) {
      throw new ConflictError('Email already exists');
    }
  }
  
  private async saveUser(userData: CreateUserRequest): Promise<UserProfile> {
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    
    return this.userRepository.save({
      ...userData,
      password: hashedPassword,
      role: userData.role || UserService.DEFAULT_ROLE,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  
  private isValidId(id: string): boolean {
    return /^[a-zA-Z0-9\-_]{8,}$/.test(id);
  }
}
```

### 🔧 錯誤處理

```typescript
// ✅ 自定義錯誤類型
abstract class AppError extends Error {
  abstract readonly statusCode: number;
  abstract readonly isOperational: boolean;
  
  constructor(message: string, public readonly context?: Record<string, any>) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  readonly statusCode = 400;
  readonly isOperational = true;
  
  constructor(
    message: string,
    public readonly field?: string,
    context?: Record<string, any>
  ) {
    super(message, { field, ...context });
  }
}

class NotFoundError extends AppError {
  readonly statusCode = 404;
  readonly isOperational = true;
}

// ✅ 錯誤處理模式
const handleApiCall = async <T>(
  apiCall: () => Promise<T>,
  context: string
): Promise<T> => {
  try {
    return await apiCall();
  } catch (error) {
    logger.error(`Error in ${context}`, {
      error: error.message,
      stack: error.stack,
    });
    
    if (error instanceof AppError) {
      throw error;
    }
    
    throw new InternalServerError(`Failed to ${context}`);
  }
};
```

---

## React 組件風格 / React Component Style

### 🧩 函數組件結構

```typescript
// ✅ 完整的組件結構
interface UserCardProps {
  user: UserProfile;
  variant?: 'default' | 'compact' | 'detailed';
  showActions?: boolean;
  onEdit?: (user: UserProfile) => void;
  onDelete?: (userId: string) => void;
  className?: string;
  'data-testid'?: string;
}

const UserCard: React.FC<UserCardProps> = ({
  user,
  variant = 'default',
  showActions = true,
  onEdit,
  onDelete,
  className,
  'data-testid': testId = 'user-card',
}) => {
  // 1. Hooks (狀態、效果、自定義 hooks)
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { permissions } = useUserPermissions();
  const theme = useTheme();
  
  // 2. 計算值和記憶化
  const canEdit = useMemo(() => 
    permissions.includes('users:edit') || user.id === currentUser?.id,
    [permissions, user.id, currentUser?.id]
  );
  
  const displayName = useMemo(() => 
    user.name || user.email.split('@')[0],
    [user.name, user.email]
  );
  
  // 3. 事件處理函數
  const handleEdit = useCallback(() => {
    onEdit?.(user);
    setIsExpanded(false);
  }, [user, onEdit]);
  
  const handleDelete = useCallback(async () => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      await onDelete?.(user.id);
    } catch (error) {
      toast.error('Failed to delete user');
    } finally {
      setIsLoading(false);
    }
  }, [user.id, onDelete]);
  
  const handleToggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);
  
  // 4. 副作用
  useEffect(() => {
    if (isExpanded) {
      // 記錄展開事件用於分析
      analytics.track('user_card_expanded', { userId: user.id });
    }
  }, [isExpanded, user.id]);
  
  // 5. 條件渲染邏輯
  if (!user) {
    return <div data-testid={`${testId}-empty`}>No user data</div>;
  }
  
  // 6. 渲染輔助函數
  const renderUserAvatar = () => (
    <div className="relative">
      <img
        src={user.avatar || '/default-avatar.png'}
        alt={`${displayName}'s avatar`}
        className="w-12 h-12 rounded-full object-cover"
        loading="lazy"
      />
      {user.isOnline && (
        <div 
          className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"
          title="Online"
        />
      )}
    </div>
  );
  
  const renderActions = () => {
    if (!showActions) return null;
    
    return (
      <div className="flex gap-2">
        {canEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEdit}
            disabled={isLoading}
            data-testid={`${testId}-edit-button`}
          >
            <EditIcon className="w-4 h-4" />
            Edit
          </Button>
        )}
        
        {permissions.includes('users:delete') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={isLoading}
            className="text-red-600 hover:text-red-700"
            data-testid={`${testId}-delete-button`}
          >
            <DeleteIcon className="w-4 h-4" />
            Delete
          </Button>
        )}
      </div>
    );
  };
  
  // 7. 主要 JSX 返回
  return (
    <Card
      className={cn(
        'transition-all duration-200',
        variant === 'compact' && 'p-3',
        variant === 'detailed' && 'p-6',
        className
      )}
      data-testid={testId}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          {renderUserAvatar()}
          
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 truncate">
              {displayName}
            </h3>
            
            <p className="text-sm text-gray-600 truncate">
              {user.email}
            </p>
            
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={getRoleVariant(user.role)}>
                {user.role}
              </Badge>
              
              {user.isVerified && (
                <VerifiedIcon 
                  className="w-4 h-4 text-blue-500" 
                  title="Verified user"
                />
              )}
            </div>
            
            {variant === 'detailed' && isExpanded && (
              <div className="mt-3 space-y-2 text-sm text-gray-600">
                <p>Joined: {formatDate(user.createdAt)}</p>
                <p>Last active: {formatRelativeTime(user.lastActiveAt)}</p>
                {user.department && (
                  <p>Department: {user.department}</p>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {variant === 'detailed' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleExpand}
              data-testid={`${testId}-expand-button`}
            >
              <ChevronDownIcon 
                className={cn(
                  'w-4 h-4 transition-transform',
                  isExpanded && 'transform rotate-180'
                )}
              />
            </Button>
          )}
          
          {renderActions()}
        </div>
      </div>
      
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
          <LoadingSpinner size="sm" />
        </div>
      )}
    </Card>
  );
};

// 8. 默認屬性和記憶化匯出
UserCard.displayName = 'UserCard';

export default React.memo(UserCard);
```

### 🎨 Hooks 使用規範

```typescript
// ✅ 自定義 Hook 結構
interface UseUserOptions {
  refreshInterval?: number;
  retryOnError?: boolean;
}

interface UseUserReturn {
  user: UserProfile | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  update: (updates: Partial<UserProfile>) => Promise<void>;
}

const useUser = (
  userId: string,
  options: UseUserOptions = {}
): UseUserReturn => {
  const { refreshInterval = 0, retryOnError = true } = options;
  
  // 狀態定義
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // 引用外部 hooks
  const { toast } = useToast();
  const retryCount = useRef(0);
  const maxRetries = 3;
  
  // 核心功能函數
  const fetchUser = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const userData = await userApi.getById(userId);
      setUser(userData);
      retryCount.current = 0;
    } catch (err) {
      const error = err as Error;
      setError(error);
      
      if (retryOnError && retryCount.current < maxRetries) {
        retryCount.current++;
        
        // 指數退避重試
        const delay = Math.pow(2, retryCount.current) * 1000;
        setTimeout(fetchUser, delay);
      }
    } finally {
      setIsLoading(false);
    }
  }, [userId, retryOnError]);
  
  const updateUser = useCallback(async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error('No user to update');
    
    try {
      const updatedUser = await userApi.update(user.id, updates);
      setUser(updatedUser);
      toast.success('User updated successfully');
    } catch (error) {
      toast.error('Failed to update user');
      throw error;
    }
  }, [user, toast]);
  
  // 副作用
  useEffect(() => {
    if (userId) {
      fetchUser();
    }
  }, [userId, fetchUser]);
  
  // 定期刷新
  useEffect(() => {
    if (refreshInterval > 0 && userId) {
      const interval = setInterval(fetchUser, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval, userId, fetchUser]);
  
  return {
    user,
    isLoading,
    error,
    refetch: fetchUser,
    update: updateUser,
  };
};
```

### 🎪 上下文 (Context) 使用

```typescript
// ✅ Context 定義和 Provider
interface AuthContextValue {
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // 初始化認證狀態
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          const userData = await authApi.verifyToken(token);
          setUser(userData);
        }
      } catch (error) {
        localStorage.removeItem('auth_token');
      } finally {
        setIsLoading(false);
      }
    };
    
    initAuth();
  }, []);
  
  const login = useCallback(async (credentials: LoginCredentials) => {
    const { user, token } = await authApi.login(credentials);
    
    localStorage.setItem('auth_token', token);
    setUser(user);
  }, []);
  
  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      localStorage.removeItem('auth_token');
      setUser(null);
    }
  }, []);
  
  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error('No authenticated user');
    
    const updatedUser = await authApi.updateProfile(updates);
    setUser(updatedUser);
  }, [user]);
  
  const value = useMemo<AuthContextValue>(() => ({
    user,
    isAuthenticated: !!user,
    login,
    logout,
    updateProfile,
  }), [user, login, logout, updateProfile]);
  
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ✅ Hook 使用 Context
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
```

---

## NestJS 後端風格 / NestJS Backend Style

### 🏗️ 控制器 (Controller) 結構

```typescript
// ✅ 控制器定義
@Controller('users')
@ApiTags('Users')
@UseGuards(AuthGuard)
export class UsersController {
  private readonly logger = new Logger(UsersController.name);
  
  constructor(
    private readonly usersService: UsersService,
    private readonly auditService: AuditService
  ) {}
  
  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  async findAll(
    @Query() query: GetUsersQueryDto,
    @CurrentUser() currentUser: UserProfile
  ): Promise<PaginatedResponse<UserProfile>> {
    this.logger.log(`Fetching users with query: ${JSON.stringify(query)}`);
    
    const result = await this.usersService.findAll(query);
    
    await this.auditService.log({
      action: 'users.list',
      userId: currentUser.id,
      metadata: { query, resultCount: result.data.length },
    });
    
    return result;
  }
  
  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: UserProfile
  ): Promise<UserProfile> {
    const user = await this.usersService.findById(id);
    
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    
    // 檢查權限
    if (!this.canViewUser(currentUser, user)) {
      throw new ForbiddenException('Insufficient permissions to view this user');
    }
    
    return user;
  }
  
  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @UseGuards(RolesGuard)
  @Roles('admin')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() currentUser: UserProfile
  ): Promise<UserProfile> {
    this.logger.log(`Creating user: ${createUserDto.email}`);
    
    const user = await this.usersService.create(createUserDto, currentUser);
    
    await this.auditService.log({
      action: 'users.create',
      userId: currentUser.id,
      targetUserId: user.id,
      metadata: { email: user.email, role: user.role },
    });
    
    return user;
  }
  
  @Put(':id')
  @ApiOperation({ summary: 'Update user' })
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: UserProfile
  ): Promise<UserProfile> {
    const existingUser = await this.usersService.findById(id);
    
    if (!existingUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    
    if (!this.canEditUser(currentUser, existingUser)) {
      throw new ForbiddenException('Insufficient permissions to edit this user');
    }
    
    const updatedUser = await this.usersService.update(id, updateUserDto);
    
    await this.auditService.log({
      action: 'users.update',
      userId: currentUser.id,
      targetUserId: id,
      metadata: { changes: updateUserDto },
    });
    
    return updatedUser;
  }
  
  @Delete(':id')
  @ApiOperation({ summary: 'Delete user' })
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: UserProfile
  ): Promise<void> {
    const user = await this.usersService.findById(id);
    
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    
    if (user.id === currentUser.id) {
      throw new BadRequestException('Cannot delete your own account');
    }
    
    await this.usersService.remove(id);
    
    await this.auditService.log({
      action: 'users.delete',
      userId: currentUser.id,
      targetUserId: id,
      metadata: { deletedUser: { email: user.email, role: user.role } },
    });
  }
  
  // 私有輔助方法
  private canViewUser(currentUser: UserProfile, targetUser: UserProfile): boolean {
    if (currentUser.role === 'admin') return true;
    if (currentUser.role === 'manager' && targetUser.role !== 'admin') return true;
    if (currentUser.id === targetUser.id) return true;
    
    return false;
  }
  
  private canEditUser(currentUser: UserProfile, targetUser: UserProfile): boolean {
    if (currentUser.role === 'admin') return true;
    if (currentUser.role === 'manager' && !['admin', 'manager'].includes(targetUser.role)) return true;
    
    return false;
  }
}
```

### 🔧 服務 (Service) 結構

```typescript
// ✅ 服務定義
@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly passwordService: PasswordService,
    private readonly emailService: EmailService,
    private readonly cacheService: CacheService
  ) {}
  
  async findAll(query: GetUsersQueryDto): Promise<PaginatedResponse<UserProfile>> {
    const { page = 1, limit = 10, search, role, isActive } = query;
    
    // 構建查詢
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.name',
        'user.email',
        'user.role',
        'user.isActive',
        'user.createdAt',
        'user.updatedAt',
      ]);
    
    // 應用篩選條件
    if (search) {
      queryBuilder.andWhere(
        '(user.name ILIKE :search OR user.email ILIKE :search)',
        { search: `%${search}%` }
      );
    }
    
    if (role) {
      queryBuilder.andWhere('user.role = :role', { role });
    }
    
    if (typeof isActive === 'boolean') {
      queryBuilder.andWhere('user.isActive = :isActive', { isActive });
    }
    
    // 應用排序和分頁
    queryBuilder
      .orderBy('user.createdAt', 'DESC')
      .take(limit)
      .skip((page - 1) * limit);
    
    const [users, total] = await queryBuilder.getManyAndCount();
    
    return {
      data: users.map(user => this.mapToProfile(user)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
  
  async findById(id: string): Promise<UserProfile | null> {
    const cacheKey = `user:${id}`;
    
    // 嘗試從緩存獲取
    const cached = await this.cacheService.get<UserProfile>(cacheKey);
    if (cached) {
      return cached;
    }
    
    const user = await this.userRepository.findOne({
      where: { id },
      select: [
        'id', 'name', 'email', 'role', 'isActive', 
        'createdAt', 'updatedAt', 'lastLoginAt'
      ],
    });
    
    if (!user) {
      return null;
    }
    
    const profile = this.mapToProfile(user);
    
    // 緩存結果
    await this.cacheService.set(cacheKey, profile, 300); // 5分鐘
    
    return profile;
  }
  
  async create(
    createUserDto: CreateUserDto,
    createdBy: UserProfile
  ): Promise<UserProfile> {
    // 檢查郵箱唯一性
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });
    
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }
    
    // 哈希密碼
    const hashedPassword = await this.passwordService.hash(createUserDto.password);
    
    // 創建用戶實體
    const userEntity = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
      createdBy: createdBy.id,
    });
    
    // 儲存到資料庫
    const savedUser = await this.userRepository.save(userEntity);
    
    // 發送歡迎郵件
    try {
      await this.emailService.sendWelcomeEmail(
        savedUser.email,
        savedUser.name || savedUser.email,
        { 
          loginUrl: process.env.FRONTEND_URL + '/login',
          supportEmail: process.env.SUPPORT_EMAIL,
        }
      );
    } catch (error) {
      this.logger.warn(`Failed to send welcome email to ${savedUser.email}`, error);
    }
    
    this.logger.log(`User created: ${savedUser.email} by ${createdBy.email}`);
    
    return this.mapToProfile(savedUser);
  }
  
  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserProfile> {
    const user = await this.userRepository.findOne({ where: { id } });
    
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    
    // 如果更新郵箱，檢查唯一性
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });
      
      if (existingUser) {
        throw new ConflictException('Email already exists');
      }
    }
    
    // 如果更新密碼，進行哈希
    if (updateUserDto.password) {
      updateUserDto.password = await this.passwordService.hash(updateUserDto.password);
    }
    
    // 更新用戶
    await this.userRepository.update(id, {
      ...updateUserDto,
      updatedAt: new Date(),
    });
    
    // 清除緩存
    await this.cacheService.delete(`user:${id}`);
    
    // 返回更新後的用戶
    const updatedUser = await this.userRepository.findOne({ where: { id } });
    
    return this.mapToProfile(updatedUser!);
  }
  
  async remove(id: string): Promise<void> {
    const result = await this.userRepository.softDelete(id);
    
    if (result.affected === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    
    // 清除緩存
    await this.cacheService.delete(`user:${id}`);
    
    this.logger.log(`User deleted: ${id}`);
  }
  
  // 私有輔助方法
  private mapToProfile(user: UserEntity): UserProfile {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt,
    };
  }
}
```

### 🎯 DTO 和驗證

```typescript
// ✅ DTO 定義
export class CreateUserDto {
  @ApiProperty({ description: 'User full name', example: 'John Doe' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Matches(/^[a-zA-Z\s]+$/, { message: 'Name can only contain letters and spaces' })
  name?: string;
  
  @ApiProperty({ description: 'User email address', example: 'john@example.com' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;
  
  @ApiProperty({ description: 'User password', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(128)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    { message: 'Password must contain uppercase, lowercase, number and special character' }
  )
  password: string;
  
  @ApiProperty({ 
    description: 'User role', 
    enum: ['admin', 'manager', 'caseworker', 'client'],
    default: 'client'
  })
  @IsOptional()
  @IsEnum(['admin', 'manager', 'caseworker', 'client'])
  role?: UserRole = 'client';
  
  @ApiProperty({ description: 'User department', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  department?: string;
  
  @ApiProperty({ description: 'Phone number', required: false })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, { message: 'Please provide a valid phone number' })
  phone?: string;
}

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password'])
) {
  @ApiProperty({ description: 'New password', required: false })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    { message: 'Password must contain uppercase, lowercase, number and special character' }
  )
  password?: string;
  
  @ApiProperty({ description: 'Account status', required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class GetUsersQueryDto {
  @ApiProperty({ description: 'Page number', minimum: 1, default: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be at least 1' })
  page?: number = 1;
  
  @ApiProperty({ description: 'Items per page', minimum: 1, maximum: 100, default: 10, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  limit?: number = 10;
  
  @ApiProperty({ description: 'Search term for name or email', required: false })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Search term must be at least 2 characters' })
  @MaxLength(100)
  search?: string;
  
  @ApiProperty({ description: 'Filter by role', enum: ['admin', 'manager', 'caseworker', 'client'], required: false })
  @IsOptional()
  @IsEnum(['admin', 'manager', 'caseworker', 'client'])
  role?: UserRole;
  
  @ApiProperty({ description: 'Filter by active status', required: false })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isActive?: boolean;
}
```

---

## CSS/Tailwind 風格 / CSS/Tailwind Style

### 🎨 Tailwind CSS 使用規範

```tsx
// ✅ 組件中的 Tailwind 使用
const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  className,
  ...props 
}) => {
  return (
    <button
      className={cn(
        // 基礎樣式
        'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        
        // 變體樣式
        {
          // Primary 變體
          'bg-primary text-primary-foreground hover:bg-primary/90': variant === 'primary',
          // Secondary 變體
          'bg-secondary text-secondary-foreground hover:bg-secondary/80': variant === 'secondary',
          // Destructive 變體
          'bg-destructive text-destructive-foreground hover:bg-destructive/90': variant === 'destructive',
          // Outline 變體
          'border border-input bg-background hover:bg-accent hover:text-accent-foreground': variant === 'outline',
          // Ghost 變體
          'hover:bg-accent hover:text-accent-foreground': variant === 'ghost',
          // Link 變體
          'text-primary underline-offset-4 hover:underline': variant === 'link',
        },
        
        // 尺寸樣式
        {
          'h-10 px-4 py-2': size === 'default',
          'h-9 rounded-md px-3': size === 'sm',
          'h-11 rounded-md px-8': size === 'lg',
          'h-10 w-10': size === 'icon',
        },
        
        // 自定義類名
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

// ✅ 複雜佈局的類名組織
const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      <div className="relative flex min-h-screen flex-col">
        {/* Header */}
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center">
            <MainNav />
            <MobileNav />
            <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
              <div className="w-full flex-1 md:w-auto md:flex-none">
                <CommandMenu />
              </div>
              <nav className="flex items-center">
                <UserNav />
              </nav>
            </div>
          </div>
        </header>
        
        {/* Main Content */}
        <div className="flex-1">
          <div className="border-b">
            <div className="container flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
              {/* Sidebar */}
              <aside className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 md:sticky md:block">
                <ScrollArea className="h-full py-6 pr-6 lg:py-8">
                  <Sidebar />
                </ScrollArea>
              </aside>
              
              {/* Content */}
              <main className="relative py-6 lg:gap-10 lg:py-8 xl:gap-20">
                <div className="mx-auto w-full min-w-0">
                  {children}
                </div>
              </main>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
```

### 🔧 CSS 自定義屬性

```css
/* globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Light theme colors */
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222.2 84% 4.9%;
    --muted: 210 40% 96%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96%;
    --accent-foreground: 222.2 84% 4.9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
    
    /* Animation durations */
    --duration-fast: 150ms;
    --duration-normal: 250ms;
    --duration-slow: 350ms;
    
    /* Z-index scale */
    --z-dropdown: 1000;
    --z-sticky: 1020;
    --z-fixed: 1030;
    --z-modal-backdrop: 1040;
    --z-modal: 1050;
    --z-popover: 1060;
    --z-tooltip: 1070;
  }

  .dark {
    /* Dark theme colors */
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 84% 4.9%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 94.1%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  
  body {
    @apply bg-background text-foreground;
  }
  
  /* Custom scrollbar */
  .scrollbar-thin {
    scrollbar-width: thin;
    scrollbar-color: theme('colors.gray.400') theme('colors.gray.100');
  }
  
  .scrollbar-thin::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  
  .scrollbar-thin::-webkit-scrollbar-track {
    @apply bg-gray-100 dark:bg-gray-800;
  }
  
  .scrollbar-thin::-webkit-scrollbar-thumb {
    @apply bg-gray-400 dark:bg-gray-600 rounded-full;
  }
  
  .scrollbar-thin::-webkit-scrollbar-thumb:hover {
    @apply bg-gray-500 dark:bg-gray-500;
  }
}

@layer components {
  /* Custom component styles */
  .btn-primary {
    @apply bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring;
  }
  
  .card {
    @apply bg-card text-card-foreground rounded-lg border shadow-sm;
  }
  
  .input {
    @apply flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50;
  }
}

@layer utilities {
  /* Custom utility classes */
  .text-gradient {
    @apply bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent;
  }
  
  .animate-in {
    animation: enter var(--duration-normal) ease-out;
  }
  
  .animate-out {
    animation: exit var(--duration-normal) ease-in;
  }
  
  @keyframes enter {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes exit {
    from {
      opacity: 1;
      transform: translateY(0);
    }
    to {
      opacity: 0;
      transform: translateY(-10px);
    }
  }
}
```

---

## 文件組織 / File Organization

### 📁 專案結構

```
src/
├── components/           # 可重用組件
│   ├── ui/              # 基礎 UI 組件
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.test.tsx
│   │   │   ├── Button.stories.tsx
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── forms/           # 表單組件
│   ├── layout/          # 佈局組件
│   └── feature/         # 功能特定組件
├── hooks/               # 自定義 Hooks
│   ├── useAuth.ts
│   ├── useLocalStorage.ts
│   └── index.ts
├── lib/                 # 工具庫和配置
│   ├── api/            # API 客戶端
│   ├── utils/          # 工具函數
│   ├── validations/    # 驗證規則
│   └── constants/      # 常數定義
├── store/              # 狀態管理
├── types/              # 類型定義
├── app/                # Next.js App Router
└── styles/             # 樣式文件
```

### 📄 文件命名規範

```typescript
// ✅ 組件文件命名
UserProfile.tsx         // React 組件 - PascalCase
UserProfile.test.tsx    // 測試文件
UserProfile.stories.tsx // Storybook 故事
user-profile.module.css // CSS 模組 - kebab-case

// ✅ Hook 文件命名
useUserProfile.ts       // 自定義 Hook - camelCase with use prefix
useAuth.test.ts        // Hook 測試文件

// ✅ 工具文件命名
format-date.ts         // 工具函數 - kebab-case
api-client.ts          // API 客戶端
constants.ts           // 常數文件

// ✅ 類型文件命名
user.types.ts          // 類型定義
api.types.ts           // API 類型
common.types.ts        # 通用類型
```

### 🗂️ 匯入/匯出規範

```typescript
// ✅ 匯出規範 - 使用具名匯出
// components/ui/Button/Button.tsx
export const Button: React.FC<ButtonProps> = ({ ... }) => {
  // ...
};

// components/ui/Button/index.ts
export { Button } from './Button';
export type { ButtonProps } from './Button';

// components/ui/index.ts
export { Button } from './Button';
export { Input } from './Input';
export { Card } from './Card';

// ✅ 匯入規範 - 按順序組織
// 1. React 和相關庫
import React, { useState, useCallback } from 'react';
import { NextPage } from 'next';

// 2. 第三方庫 (按字母順序)
import axios from 'axios';
import clsx from 'clsx';
import { toast } from 'react-hot-toast';

// 3. 內部組件和 hooks (按距離排序)
import { Button, Card, Input } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { UserService } from '@/lib/services';

// 4. 類型匯入 (分組放在最後)
import type { User, CreateUserRequest } from '@/types/user';
import type { ApiResponse } from '@/types/api';
```

---

## 命名規範 / Naming Conventions

### 🏷️ 變數和函數命名

```typescript
// ✅ 變數命名 - camelCase
const userName = 'john.doe';
const isAuthenticated = true;
const userProfile = await fetchUserProfile();

// ✅ 常數命名 - SCREAMING_SNAKE_CASE
const API_BASE_URL = 'https://api.example.com';
const MAX_RETRY_ATTEMPTS = 3;
const USER_ROLES = ['admin', 'user', 'guest'] as const;

// ✅ 函數命名 - camelCase，動詞開頭
const getUserById = (id: string) => { /* ... */ };
const validateEmail = (email: string) => { /* ... */ };
const calculateTotalPrice = (items: CartItem[]) => { /* ... */ };

// ✅ 事件處理函數 - handle 前綴
const handleSubmit = (event: FormEvent) => { /* ... */ };
const handleUserClick = (user: User) => { /* ... */ };
const handleModalClose = () => { /* ... */ };

// ✅ 布林值命名 - is/has/can/should 前綴
const isLoading = true;
const hasPermission = false;
const canEdit = true;
const shouldShowModal = false;

// ✅ 數組命名 - 複數形式
const users = await fetchUsers();
const activeUsers = users.filter(user => user.isActive);
const userIds = users.map(user => user.id);
```

### 🏗️ 類別和介面命名

```typescript
// ✅ 類別命名 - PascalCase
class UserService {
  private readonly apiClient: ApiClient;
  
  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }
}

class EmailValidator {
  static validate(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}

// ✅ 介面命名 - PascalCase，描述性
interface UserProfile {
  id: string;
  name: string;
  email: string;
}

interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
}

interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

// ✅ 型別別名 - PascalCase
type UserRole = 'admin' | 'user' | 'guest';
type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
type EventHandler<T> = (event: T) => void;
```

### 🧩 組件命名

```typescript
// ✅ React 組件 - PascalCase
const UserCard: React.FC<UserCardProps> = ({ user }) => {
  return <div>{user.name}</div>;
};

const LoginForm: React.FC = () => {
  return <form>...</form>;
};

// ✅ 高階組件 - with 前綴
const withAuth = <P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> => {
  return (props: P) => {
    const { isAuthenticated } = useAuth();
    
    if (!isAuthenticated) {
      return <LoginPrompt />;
    }
    
    return <Component {...props} />;
  };
};

// ✅ Hook 命名 - use 前綴 + camelCase
const useUserProfile = (userId: string) => {
  // ...
};

const useLocalStorage = <T>(key: string, initialValue: T) => {
  // ...
};
```

---

## 註釋和文檔 / Comments and Documentation

### 📝 註釋規範

```typescript
// ✅ 函數文檔註釋
/**
 * Calculates the total price of items in a shopping cart
 * including taxes and applicable discounts.
 * 
 * @param items - Array of cart items
 * @param taxRate - Tax rate as decimal (e.g., 0.08 for 8%)
 * @param discountCode - Optional discount code to apply
 * @returns The total price including tax and discounts
 * 
 * @throws {ValidationError} When tax rate is negative or greater than 1
 * @throws {NotFoundError} When discount code is invalid
 * 
 * @example
 * ```typescript
 * const total = calculateCartTotal(
 *   [{ price: 100, quantity: 2 }],
 *   0.08,
 *   'SAVE10'
 * );
 * console.log(total); // 194.4 (200 - 10% discount + 8% tax)
 * ```
 */
const calculateCartTotal = (
  items: CartItem[],
  taxRate: number,
  discountCode?: string
): number => {
  if (taxRate < 0 || taxRate > 1) {
    throw new ValidationError('Tax rate must be between 0 and 1');
  }
  
  // Calculate subtotal
  let subtotal = items.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);
  
  // Apply discount if provided
  if (discountCode) {
    const discount = getDiscountAmount(discountCode, subtotal);
    subtotal -= discount;
  }
  
  // Calculate tax on discounted amount
  const tax = subtotal * taxRate;
  
  return subtotal + tax;
};

// ✅ 類別文檔註釋
/**
 * Service for managing user authentication and authorization.
 * 
 * Handles user login, logout, token management, and permission checking.
 * Integrates with external OAuth providers and maintains session state.
 * 
 * @example
 * ```typescript
 * const authService = new AuthService(apiClient, tokenStorage);
 * 
 * // Login user
 * const user = await authService.login('user@example.com', 'password');
 * 
 * // Check permissions
 * if (authService.hasPermission('users:read')) {
 *   // User can read users
 * }
 * ```
 */
class AuthService {
  private readonly apiClient: ApiClient;
  private readonly tokenStorage: TokenStorage;
  private currentUser: User | null = null;
  
  constructor(apiClient: ApiClient, tokenStorage: TokenStorage) {
    this.apiClient = apiClient;
    this.tokenStorage = tokenStorage;
  }
  
  /**
   * Authenticates a user with email and password.
   * 
   * @param email - User's email address
   * @param password - User's password
   * @returns Promise resolving to authenticated user
   */
  async login(email: string, password: string): Promise<User> {
    // Implementation...
  }
}

// ✅ 複雜邏輯註釋
const processPayment = async (payment: PaymentRequest): Promise<PaymentResult> => {
  // Validate payment amount (must be positive and within limits)
  if (payment.amount <= 0 || payment.amount > MAX_PAYMENT_AMOUNT) {
    throw new ValidationError('Invalid payment amount');
  }
  
  // Apply business rules for payment processing
  // 1. Check if user has sufficient balance for wallet payments  
  // 2. Validate credit card details for card payments
  // 3. Apply any applicable fees or surcharges
  
  let processedAmount = payment.amount;
  
  if (payment.method === 'credit_card') {
    // Add 3% processing fee for credit card payments
    const processingFee = payment.amount * 0.03;
    processedAmount += processingFee;
    
    // Validate credit card using Luhn algorithm
    if (!validateCreditCard(payment.cardNumber)) {
      throw new ValidationError('Invalid credit card number');
    }
  }
  
  // Process payment through external gateway
  // Retry up to 3 times with exponential backoff for network failures
  const result = await retryWithBackoff(
    () => paymentGateway.processPayment({
      amount: processedAmount,
      currency: payment.currency,
      method: payment.method,
    }),
    { maxRetries: 3, baseDelay: 1000 }
  );
  
  return result;
};

// ✅ TODO 和 FIXME 註釋
class UserService {
  async createUser(userData: CreateUserRequest): Promise<User> {
    // TODO: Add email verification step before creating user
    // Priority: Medium, Target: v1.2.0
    
    // FIXME: This validation logic should be moved to a separate validator class
    // See issue #123 for details
    if (!userData.email.includes('@')) {
      throw new ValidationError('Invalid email');
    }
    
    // HACK: Temporary workaround for legacy API compatibility
    // Remove this after migrating to v2 API (planned for Q2 2024)
    const legacyUserData = {
      ...userData,
      user_name: userData.name, // Legacy field name
    };
    
    return this.apiClient.post('/users', legacyUserData);
  }
}
```

### 📚 文檔字符串最佳實踐

```typescript
// ✅ API 文檔註釋
interface UserApi {
  /**
   * Retrieves a user by their unique identifier.
   * 
   * @param id - The unique user identifier (UUID v4 format)
   * @param options - Additional options for the request
   * @param options.includeProfile - Whether to include full profile data
   * @param options.includePermissions - Whether to include user permissions
   * 
   * @returns Promise that resolves to user data or null if not found
   * 
   * @throws {ValidationError} When ID format is invalid
   * @throws {NotFoundError} When user doesn't exist
   * @throws {ForbiddenError} When user lacks permission to view the user
   * 
   * @since 1.0.0
   * @version 1.2.0 - Added includePermissions option
   * 
   * @example
   * ```typescript
   * // Basic usage
   * const user = await userApi.getById('123e4567-e89b-12d3-a456-426614174000');
   * 
   * // With options
   * const userWithProfile = await userApi.getById(
   *   '123e4567-e89b-12d3-a456-426614174000',
   *   { includeProfile: true, includePermissions: true }
   * );
   * ```
   */
  getById(
    id: string, 
    options?: {
      includeProfile?: boolean;
      includePermissions?: boolean;
    }
  ): Promise<User | null>;
}
```

---

## 最佳實踐 / Best Practices

### 🔧 性能最佳實踐

```typescript
// ✅ React 性能優化
const UserList: React.FC<UserListProps> = ({ users, onUserSelect }) => {
  // 使用 useMemo 緩存昂貴的計算
  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => a.name.localeCompare(b.name));
  }, [users]);
  
  // 使用 useCallback 穩定函數引用
  const handleUserClick = useCallback((user: User) => {
    onUserSelect?.(user);
  }, [onUserSelect]);
  
  // 虛擬化長列表
  if (users.length > 100) {
    return (
      <FixedSizeList
        height={600}
        itemCount={sortedUsers.length}
        itemSize={60}
        itemData={sortedUsers}
      >
        {({ index, style, data }) => (
          <div style={style}>
            <UserItem 
              user={data[index]} 
              onClick={handleUserClick}
            />
          </div>
        )}
      </FixedSizeList>
    );
  }
  
  return (
    <div className="space-y-2">
      {sortedUsers.map(user => (
        <UserItem
          key={user.id}
          user={user}
          onClick={handleUserClick}
        />
      ))}
    </div>
  );
};

// ✅ 記憶化組件
const UserItem = React.memo<UserItemProps>(({ user, onClick }) => {
  return (
    <div 
      className="p-4 border rounded cursor-pointer hover:bg-gray-50"
      onClick={() => onClick(user)}
    >
      <h3>{user.name}</h3>
      <p>{user.email}</p>
    </div>
  );
});

UserItem.displayName = 'UserItem';
```

### 🛡️ 安全最佳實踐

```typescript
// ✅ 輸入驗證和清理
const sanitizeHtml = (input: string): string => {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
    ALLOWED_ATTR: ['href'],
  });
};

const validateAndSanitizeInput = (data: unknown): CreateUserRequest => {
  // 使用 Zod 進行類型驗證
  const schema = z.object({
    name: z.string().min(2).max(100).regex(/^[a-zA-Z\s]+$/),
    email: z.string().email().toLowerCase(),
    password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/),
  });
  
  const validated = schema.parse(data);
  
  return {
    name: sanitizeHtml(validated.name),
    email: validated.email,
    password: validated.password, // 密碼不需要清理，會被哈希
  };
};

// ✅ SQL 注入防護
const getUsersByRole = async (role: string): Promise<User[]> => {
  // 使用參數化查詢
  const query = `
    SELECT id, name, email, created_at
    FROM users 
    WHERE role = $1 AND is_active = true
    ORDER BY created_at DESC
  `;
  
  const result = await db.query(query, [role]);
  return result.rows;
};

// ✅ 權限檢查
const requirePermission = (permission: string) => {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    const method = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const user = this.getCurrentUser();
      
      if (!user) {
        throw new UnauthorizedError('Authentication required');
      }
      
      if (!user.permissions.includes(permission)) {
        throw new ForbiddenError(`Missing permission: ${permission}`);
      }
      
      return method.apply(this, args);
    };
    
    return descriptor;
  };
};

class UserController {
  @requirePermission('users:read')
  async getAllUsers(): Promise<User[]> {
    return this.userService.findAll();
  }
}
```

### 🔧 錯誤處理最佳實踐

```typescript
// ✅ 結構化錯誤處理
abstract class AppError extends Error {
  abstract readonly statusCode: number;
  abstract readonly isOperational: boolean;
  
  constructor(
    message: string,
    public readonly context?: Record<string, any>,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = this.constructor.name;
    
    // 保持堆棧追蹤
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      context: this.context,
      stack: this.stack,
    };
  }
}

class ValidationError extends AppError {
  readonly statusCode = 400;
  readonly isOperational = true;
  
  constructor(message: string, public readonly field?: string) {
    super(message, { field });
  }
}

// ✅ 錯誤邊界組件
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });
    
    // 記錄錯誤到監控服務
    logger.error('React Error Boundary caught an error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-12 w-12 text-red-500" />
              <div className="ml-4">
                <h1 className="text-lg font-medium text-gray-900">
                  Something went wrong
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  We're sorry, but something unexpected happened. Please try refreshing the page.
                </p>
              </div>
            </div>
            
            <div className="mt-6 flex space-x-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90"
              >
                Refresh Page
              </button>
              <button
                onClick={() => this.setState({ hasError: false })}
                className="flex-1 bg-gray-200 text-gray-900 px-4 py-2 rounded-md hover:bg-gray-300"
              >
                Try Again
              </button>
            </div>
            
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Error Details (Development Only)
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {this.state.error?.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

---

## 工具配置 / Tool Configuration

### 🔧 VS Code 配置

```json
// .vscode/settings.json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.preferences.includePackageJsonAutoImports": "auto",
  "typescript.suggest.autoImports": true,
  "typescript.updateImportsOnFileMove.enabled": "always",
  
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true,
    "source.removeUnusedImports": true
  },
  
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  },
  
  "files.associations": {
    "*.css": "tailwindcss"
  },
  
  "tailwindCSS.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  },
  
  "jest.autoRun": {
    "watch": true,
    "onSave": "test-src-file"
  }
}
```

### 📝 代碼片段

```json
// .vscode/snippets/typescript.json
{
  "React Functional Component": {
    "prefix": "rfc",
    "body": [
      "interface ${1:ComponentName}Props {",
      "  $2",
      "}",
      "",
      "const ${1:ComponentName}: React.FC<${1:ComponentName}Props> = ({",
      "  $3",
      "}) => {",
      "  return (",
      "    <div>",
      "      $4",
      "    </div>",
      "  );",
      "};",
      "",
      "export default ${1:ComponentName};"
    ],
    "description": "Create a React functional component with TypeScript"
  },
  
  "Custom Hook": {
    "prefix": "hook",
    "body": [
      "interface Use${1:HookName}Options {",
      "  $2",
      "}",
      "",
      "interface Use${1:HookName}Return {",
      "  $3",
      "}",
      "",
      "const use${1:HookName} = (options: Use${1:HookName}Options = {}): Use${1:HookName}Return => {",
      "  $4",
      "  ",
      "  return {",
      "    $5",
      "  };",
      "};",
      "",
      "export default use${1:HookName};"
    ],
    "description": "Create a custom React hook with TypeScript"
  }
}
```

---

*本風格指引是活文檔，會隨著專案發展和最佳實踐的演進而持續更新。所有開發者都應該遵循這些標準，並積極參與改進討論。*