import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { UsersService } from '../../users/users.service';
import { UserStatus } from '../../users/entities/user.entity';

// Mock bcryptjs
jest.mock('bcryptjs');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    password: 'hashedPassword123',
    firstName: 'Test',
    lastName: 'User',
    role: 'caseworker',
    status: UserStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockUsersService = {
      findByEmail: jest.fn(),
      findByEmailWithPassword: jest.fn(),
      validatePassword: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      updateLastLogin: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn(),
      signAsync: jest.fn(),
      verify: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should return user data when credentials are valid', async () => {
      // Arrange
      usersService.findByEmailWithPassword.mockResolvedValue(mockUser as any);
      usersService.validatePassword.mockResolvedValue(true);

      // Act
      const result = await service.validateUser('test@example.com', 'password123');

      // Assert
      expect(result).toBeDefined();
      expect(result.email).toBe('test@example.com');
      expect(usersService.findByEmailWithPassword).toHaveBeenCalledWith('test@example.com');
      expect(usersService.validatePassword).toHaveBeenCalledWith(mockUser, 'password123');
    });

    it('should return null when user does not exist', async () => {
      // Arrange
      usersService.findByEmailWithPassword.mockResolvedValue(null);

      // Act
      const result = await service.validateUser('nonexistent@example.com', 'password123');

      // Assert
      expect(result).toBeNull();
      expect(usersService.findByEmailWithPassword).toHaveBeenCalledWith('nonexistent@example.com');
      expect(usersService.validatePassword).not.toHaveBeenCalled();
    });

    it('should return null when password is invalid', async () => {
      // Arrange
      usersService.findByEmailWithPassword.mockResolvedValue(mockUser as any);
      usersService.validatePassword.mockResolvedValue(false);

      // Act
      const result = await service.validateUser('test@example.com', 'wrongpassword');

      // Assert
      expect(result).toBeNull();
      expect(usersService.validatePassword).toHaveBeenCalledWith(mockUser, 'wrongpassword');
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException for invalid credentials', async () => {
      // Arrange
      usersService.findByEmailWithPassword.mockResolvedValue(null);

      // Act & Assert
      await expect(service.login({ email: 'test@example.com', password: 'wrongpassword' }))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshToken', () => {
    it('should throw UnauthorizedException for invalid token', async () => {
      // Arrange
      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act & Assert
      await expect(service.refreshToken('invalid.token'))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  describe('validateJwtPayload', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      // Arrange
      const payload = { sub: 'nonexistent-id', email: 'test@example.com', role: 'caseworker' };
      usersService.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.validateJwtPayload(payload))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should return user for valid payload', async () => {
      // Arrange
      const payload = { sub: mockUser.id, email: mockUser.email, role: mockUser.role };
      usersService.findOne.mockResolvedValue(mockUser as any);

      // Act
      const result = await service.validateJwtPayload(payload);

      // Assert
      expect(result).toEqual(mockUser);
      expect(usersService.findOne).toHaveBeenCalledWith(payload.sub);
    });
  });

  describe('logout', () => {
    it('should log user out successfully', async () => {
      // Act
      await service.logout(mockUser.id);

      // Assert - logout just logs, no exception should be thrown
      expect(true).toBe(true);
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      // Arrange
      usersService.findOne.mockResolvedValue(mockUser as any);

      // Act
      const result = await service.getProfile(mockUser.id);

      // Assert
      expect(result).toEqual(mockUser);
      expect(usersService.findOne).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('forgotPassword', () => {
    it('should handle password reset request', async () => {
      // Arrange
      usersService.findByEmail.mockResolvedValue(mockUser as any);

      // Act
      await service.forgotPassword('test@example.com');

      // Assert
      expect(usersService.findByEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should handle non-existent email gracefully', async () => {
      // Arrange
      usersService.findByEmail.mockResolvedValue(null);

      // Act - Should not throw
      await service.forgotPassword('nonexistent@example.com');

      // Assert
      expect(usersService.findByEmail).toHaveBeenCalledWith('nonexistent@example.com');
    });
  });
});