import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../common/enums';
import { LoginDto, RefreshTokenDto } from './dto';

// Mock bcrypt
jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

// Mock PrismaService
const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: typeof mockPrismaService;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  const mockUser = {
    id: 'user-id-123',
    email: 'test@example.com',
    password: 'hashedPassword123',
    firstName: 'John',
    lastName: 'Doe',
    role: 'CLERK',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLoginAt: new Date(),
  };

  const mockAuthenticatedUser = {
    id: 'user-id-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.CLERK,
    isActive: true,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get(PrismaService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);

    // Setup default mocks
    configService.get.mockImplementation((key: string, defaultValue?: any) => {
      const config: Record<string, any> = {
        JWT_SECRET: 'test-secret',
        JWT_REFRESH_SECRET: 'test-refresh-secret',
        JWT_EXPIRES_IN: '1h',
        JWT_REFRESH_EXPIRES_IN: '7d',
        BCRYPT_ROUNDS: 12,
      };
      return config[key] || defaultValue;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should successfully login with valid credentials', async () => {
      // Arrange
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.user.update.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);
      jwtService.signAsync.mockResolvedValueOnce('access-token').mockResolvedValueOnce('refresh-token');

      // Act
      const result = await service.login(loginDto);

      // Assert
      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        tokenType: 'Bearer',
        expiresIn: 3600,
        user: {
          id: mockUser.id,
          email: mockUser.email,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          role: mockUser.role,
          isActive: mockUser.isActive,
          lastLoginAt: mockUser.lastLoginAt,
        },
      });

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginDto.email },
        select: expect.any(Object),
      });
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(loginDto.password, mockUser.password);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { lastLoginAt: expect.any(Date) },
      });
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      // Arrange
      prismaService.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginDto.email },
        select: expect.any(Object),
      });
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      // Arrange
      const inactiveUser = { ...mockUser, isActive: false };
      prismaService.user.findUnique.mockResolvedValue(inactiveUser);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginDto.email },
        select: expect.any(Object),
      });
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      // Arrange
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(loginDto.password, mockUser.password);
    });
  });

  describe('getProfile', () => {
    it('should return user profile successfully', async () => {
      // Arrange
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      // Act
      const result = await service.getProfile(mockAuthenticatedUser);

      // Assert
      expect(result).toEqual({
        ...mockUser,
        lastLoginAt: mockUser.lastLoginAt,
      });
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockAuthenticatedUser.id },
        select: expect.any(Object),
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      // Arrange
      prismaService.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getProfile(mockAuthenticatedUser)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshToken', () => {
    const refreshTokenDto: RefreshTokenDto = {
      refreshToken: 'valid-refresh-token',
    };

    it('should successfully refresh token', async () => {
      // Arrange
      const mockPayload = {
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        type: 'refresh',
      };
      
      jwtService.verify.mockReturnValue(mockPayload);
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      jwtService.signAsync.mockResolvedValueOnce('new-access-token').mockResolvedValueOnce('new-refresh-token');

      // Act
      const result = await service.refreshToken(refreshTokenDto);

      // Assert
      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        tokenType: 'Bearer',
        expiresIn: 3600,
        user: {
          id: mockUser.id,
          email: mockUser.email,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          role: mockUser.role,
          isActive: mockUser.isActive,
          lastLoginAt: mockUser.lastLoginAt,
        },
      });

      expect(jwtService.verify).toHaveBeenCalledWith(refreshTokenDto.refreshToken, {
        secret: 'test-refresh-secret',
      });
    });

    it('should throw UnauthorizedException for invalid token type', async () => {
      // Arrange
      const mockPayload = {
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        type: 'access', // Wrong type
      };
      
      jwtService.verify.mockReturnValue(mockPayload);

      // Act & Assert
      await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid user', async () => {
      // Arrange
      const mockPayload = {
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        type: 'refresh',
      };
      
      jwtService.verify.mockReturnValue(mockPayload);
      prismaService.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('hashPassword', () => {
    it('should hash password successfully', async () => {
      // Arrange
      const password = 'password123';
      const hashedPassword = 'hashedPassword123';
      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);

      // Act
      const result = await service.hashPassword(password);

      // Assert
      expect(result).toBe(hashedPassword);
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(password, 12);
    });
  });

  describe('validatePassword', () => {
    it('should validate password successfully', async () => {
      // Arrange
      const password = 'password123';
      const hash = 'hashedPassword123';
      mockedBcrypt.compare.mockResolvedValue(true as never);

      // Act
      const result = await service.validatePassword(password, hash);

      // Assert
      expect(result).toBe(true);
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(password, hash);
    });

    it('should return false for invalid password', async () => {
      // Arrange
      const password = 'wrongPassword';
      const hash = 'hashedPassword123';
      mockedBcrypt.compare.mockResolvedValue(false as never);

      // Act
      const result = await service.validatePassword(password, hash);

      // Assert
      expect(result).toBe(false);
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(password, hash);
    });
  });
});