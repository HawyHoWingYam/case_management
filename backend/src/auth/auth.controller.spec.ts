import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserRole } from '../common/enums';
import { LoginDto, AuthResponseDto, ProfileDto, RefreshTokenDto } from './dto';
import { AuthenticatedUser } from './decorators/current-user.decorator';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockAuthenticatedUser: AuthenticatedUser = {
    id: 'user-id-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.CLERK,
    isActive: true,
  };

  const mockAuthResponse: AuthResponseDto = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    tokenType: 'Bearer',
    expiresIn: 3600,
    user: {
      id: 'user-id-123',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: UserRole.CLERK,
      isActive: true,
      lastLoginAt: new Date(),
    },
  };

  const mockProfile: ProfileDto = {
    id: 'user-id-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.CLERK,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLoginAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
            getProfile: jest.fn(),
            refreshToken: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login successfully with valid credentials', async () => {
      // Arrange
      authService.login.mockResolvedValue(mockAuthResponse);

      // Act
      const result = await controller.login(loginDto);

      // Assert
      expect(result).toEqual(mockAuthResponse);
      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });

    it('should handle login errors', async () => {
      // Arrange
      const error = new Error('Login failed');
      authService.login.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.login(loginDto)).rejects.toThrow('Login failed');
      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });
  });

  describe('getProfile', () => {
    it('should return user profile successfully', async () => {
      // Arrange
      authService.getProfile.mockResolvedValue(mockProfile);

      // Act
      const result = await controller.getProfile(mockAuthenticatedUser);

      // Assert
      expect(result).toEqual(mockProfile);
      expect(authService.getProfile).toHaveBeenCalledWith(mockAuthenticatedUser);
    });

    it('should handle profile retrieval errors', async () => {
      // Arrange
      const error = new Error('Profile not found');
      authService.getProfile.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.getProfile(mockAuthenticatedUser)).rejects.toThrow('Profile not found');
      expect(authService.getProfile).toHaveBeenCalledWith(mockAuthenticatedUser);
    });
  });

  describe('refreshToken', () => {
    const refreshTokenDto: RefreshTokenDto = {
      refreshToken: 'valid-refresh-token',
    };

    it('should refresh token successfully', async () => {
      // Arrange
      authService.refreshToken.mockResolvedValue(mockAuthResponse);

      // Act
      const result = await controller.refreshToken(refreshTokenDto);

      // Assert
      expect(result).toEqual(mockAuthResponse);
      expect(authService.refreshToken).toHaveBeenCalledWith(refreshTokenDto);
    });

    it('should handle refresh token errors', async () => {
      // Arrange
      const error = new Error('Invalid refresh token');
      authService.refreshToken.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.refreshToken(refreshTokenDto)).rejects.toThrow('Invalid refresh token');
      expect(authService.refreshToken).toHaveBeenCalledWith(refreshTokenDto);
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      // Act
      const result = await controller.logout(mockAuthenticatedUser);

      // Assert
      expect(result).toEqual({ message: 'Logout successful' });
    });
  });
});