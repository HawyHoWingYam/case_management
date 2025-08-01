import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { UserRole } from '../../common/enums';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthenticatedUser } from '../decorators/current-user.decorator';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  const mockUser: AuthenticatedUser = {
    id: 'user-id-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.CLERK,
    isActive: true,
  };

  const createMockExecutionContext = (user?: AuthenticatedUser): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user,
        }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get(Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should allow access to public routes', () => {
      // Arrange
      const context = createMockExecutionContext();
      reflector.getAllAndOverride
        .mockReturnValueOnce(true) // isPublic = true
        .mockReturnValueOnce([]); // requiredRoles = []

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
    });

    it('should allow access when no roles are required and user is authenticated', () => {
      // Arrange
      const context = createMockExecutionContext(mockUser);
      reflector.getAllAndOverride
        .mockReturnValueOnce(false) // isPublic = false
        .mockReturnValueOnce([]); // requiredRoles = []

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
    });

    it('should allow access when user has required role', () => {
      // Arrange
      const context = createMockExecutionContext(mockUser);
      reflector.getAllAndOverride
        .mockReturnValueOnce(false) // isPublic = false
        .mockReturnValueOnce([UserRole.CLERK, UserRole.CHAIR]); // requiredRoles

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
    });

    it('should deny access when user does not have required role', () => {
      // Arrange
      const context = createMockExecutionContext(mockUser);
      reflector.getAllAndOverride
        .mockReturnValueOnce(false) // isPublic = false
        .mockReturnValueOnce([UserRole.CHAIR, UserRole.CASEWORKER]); // requiredRoles

      // Act & Assert
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should deny access when no user is present and roles are required', () => {
      // Arrange
      const context = createMockExecutionContext(); // No user
      reflector.getAllAndOverride
        .mockReturnValueOnce(false) // isPublic = false
        .mockReturnValueOnce([UserRole.CLERK]); // requiredRoles

      // Act & Assert
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should work with single required role', () => {
      // Arrange
      const chairUser = { ...mockUser, role: UserRole.CHAIR };
      const context = createMockExecutionContext(chairUser);
      reflector.getAllAndOverride
        .mockReturnValueOnce(false) // isPublic = false
        .mockReturnValueOnce([UserRole.CHAIR]); // requiredRoles

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
    });

    it('should work with multiple required roles', () => {
      // Arrange
      const caseworkerUser = { ...mockUser, role: UserRole.CASEWORKER };
      const context = createMockExecutionContext(caseworkerUser);
      reflector.getAllAndOverride
        .mockReturnValueOnce(false) // isPublic = false
        .mockReturnValueOnce([UserRole.CLERK, UserRole.CHAIR, UserRole.CASEWORKER]); // requiredRoles

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
    });
  });
});