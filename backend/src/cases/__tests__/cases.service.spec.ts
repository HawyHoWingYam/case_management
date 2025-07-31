import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { CasesService } from '../cases.service';
import { Case } from '../entities/case.entity';
import { User } from '../../users/entities/user.entity';
import { CaseLog } from '../../entities/case-log.entity';
import { EmailService } from '../../email/email.service';
import { CreateCaseDto } from '../dto/create-case.dto';
import { CaseStatus, CasePriority, UserRole } from '../../common/enums';

describe('CasesService', () => {
  let service: CasesService;
  let caseRepository: jest.Mocked<Repository<Case>>;
  let caseLogRepository: jest.Mocked<Repository<CaseLog>>;
  let userRepository: jest.Mocked<Repository<User>>;
  let emailService: jest.Mocked<EmailService>;

  const mockUser: Partial<User> = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'clerk@example.com',
    password: 'hashedPassword',
    firstName: 'Test',
    lastName: 'Clerk',
    role: UserRole.CLERK,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdCases: [],
    assignedCases: [],
  };

  const mockChair: Partial<User> = {
    id: '123e4567-e89b-12d3-a456-426614174001',
    email: 'chair@example.com',
    password: 'hashedPassword',
    firstName: 'Test',
    lastName: 'Chair',
    role: UserRole.CHAIR,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdCases: [],
    assignedCases: [],
  };

  const mockCaseworker: Partial<User> = {
    id: '123e4567-e89b-12d3-a456-426614174002',
    email: 'caseworker@example.com',
    password: 'hashedPassword',
    firstName: 'Test',
    lastName: 'Caseworker',
    role: UserRole.CASEWORKER,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdCases: [],
    assignedCases: [],
  };

  const mockCase: Partial<Case> = {
    id: '123e4567-e89b-12d3-a456-426614174100',
    title: 'Test Case',
    description: 'Test case description',
    status: CaseStatus.NEW,
    priority: CasePriority.MEDIUM,
    createdBy: mockUser,
    assignedTo: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    dueDate: null,
  };

  beforeEach(async () => {
    const mockCaseRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const mockCaseLogRepository = {
      create: jest.fn(),
      save: jest.fn(),
    };

    const mockUserRepository = {
      findOne: jest.fn(),
      count: jest.fn(),
    };

    const mockEmailService = {
      sendCaseAssignmentNotification: jest.fn(),
      sendCaseStatusNotification: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CasesService,
        { provide: getRepositoryToken(Case), useValue: mockCaseRepository },
        { provide: getRepositoryToken(CaseLog), useValue: mockCaseLogRepository },
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<CasesService>(CasesService);
    caseRepository = module.get(getRepositoryToken(Case));
    caseLogRepository = module.get(getRepositoryToken(CaseLog));
    userRepository = module.get(getRepositoryToken(User));
    emailService = module.get(EmailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createCaseDto: CreateCaseDto = {
      title: 'New Test Case',
      description: 'New test case description',
      priority: CasePriority.HIGH,
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    };

    it('should create a new case successfully', async () => {
      // Arrange
      const expectedCase = { ...mockCase, ...createCaseDto, createdBy: mockUser };
      caseRepository.create.mockReturnValue(expectedCase);
      caseRepository.save.mockResolvedValue(expectedCase);
      caseLogRepository.create.mockReturnValue({} as CaseLog);
      caseLogRepository.save.mockResolvedValue({} as CaseLog);

      // Act
      const result = await service.create(createCaseDto, mockUser);

      // Assert
      expect(caseRepository.create).toHaveBeenCalledWith({
        ...createCaseDto,
        createdBy: mockUser,
        status: CaseStatus.NEW,
      });
      expect(caseRepository.save).toHaveBeenCalled();
      expect(caseLogRepository.create).toHaveBeenCalledWith({
        case: expectedCase,
        user: mockUser,
        action: 'CASE_CREATED',
        description: 'Case created',
      });
      expect(result).toEqual(expectedCase);
    });

    it('should validate due date is in the future', async () => {
      // Arrange
      const invalidDto = {
        ...createCaseDto,
        due_date: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      };

      // Act & Assert
      await expect(service.create(invalidDto, mockUser))
        .rejects.toThrow(BadRequestException);
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      caseRepository.create.mockReturnValue(mockCase);
      caseRepository.save.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.create(createCaseDto, mockUser))
        .rejects.toThrow('Database error');
    });
  });

  describe('assignCase', () => {
    it('should assign case to caseworker successfully', async () => {
      // Arrange
      const caseToAssign = { ...mockCase, status: CaseStatus.PENDING_REVIEW };
      caseRepository.findOne.mockResolvedValue(caseToAssign);
      userRepository.findOne.mockResolvedValue(mockCaseworker);
      userRepository.count.mockResolvedValue(2); // Current case load
      caseRepository.save.mockResolvedValue({
        ...caseToAssign,
        assignedTo: mockCaseworker,
        status: CaseStatus.ASSIGNED,
      });
      caseLogRepository.create.mockReturnValue({} as CaseLog);
      caseLogRepository.save.mockResolvedValue({} as CaseLog);
      emailService.sendCaseAssignmentNotification.mockResolvedValue();

      // Act
      const result = await service.assignCase(
        caseToAssign.id,
        mockCaseworker.id,
        mockChair,
      );

      // Assert
      expect(result.assignedTo).toEqual(mockCaseworker);
      expect(result.status).toBe(CaseStatus.ASSIGNED);
      expect(emailService.sendCaseAssignmentNotification).toHaveBeenCalled();
    });

    it('should prevent assignment when caseworker exceeds load limit', async () => {
      // Arrange
      const MAX_CASES_PER_WORKER = 5;
      caseRepository.findOne.mockResolvedValue(mockCase);
      userRepository.findOne.mockResolvedValue(mockCaseworker);
      userRepository.count.mockResolvedValue(MAX_CASES_PER_WORKER); // At limit

      // Act & Assert
      await expect(service.assignCase(mockCase.id, mockCaseworker.id, mockChair))
        .rejects.toThrow(BadRequestException);
    });

    it('should only allow chairs to assign cases', async () => {
      // Arrange
      caseRepository.findOne.mockResolvedValue(mockCase);

      // Act & Assert
      await expect(service.assignCase(mockCase.id, mockCaseworker.id, mockUser))
        .rejects.toThrow(ForbiddenException);
    });

    it('should not allow assignment of completed cases', async () => {
      // Arrange
      const completedCase = { ...mockCase, status: CaseStatus.COMPLETED };
      caseRepository.findOne.mockResolvedValue(completedCase);

      // Act & Assert
      await expect(service.assignCase(completedCase.id, mockCaseworker.id, mockChair))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return paginated cases with filters', async () => {
      // Arrange
      const cases = [mockCase];
      const total = 1;
      caseRepository.findAndCount.mockResolvedValue([cases, total]);

      // Act
      const result = await service.findAll({
        page: 1,
        limit: 20,
        status: CaseStatus.NEW,
      });

      // Assert
      expect(result).toEqual({
        data: cases,
        total,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
      expect(caseRepository.findAndCount).toHaveBeenCalledWith({
        where: { status: CaseStatus.NEW },
        relations: ['createdBy', 'assignedTo'],
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 20,
      });
    });

    it('should handle empty results', async () => {
      // Arrange
      caseRepository.findAndCount.mockResolvedValue([[], 0]);

      // Act
      const result = await service.findAll({ page: 1, limit: 20 });

      // Assert
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });
  });

  describe('updateStatus', () => {
    it('should update case status and create log entry', async () => {
      // Arrange
      const updatedCase = { ...mockCase, status: CaseStatus.IN_PROGRESS };
      caseRepository.findOne.mockResolvedValue(mockCase);
      caseRepository.save.mockResolvedValue(updatedCase);
      caseLogRepository.create.mockReturnValue({} as CaseLog);
      caseLogRepository.save.mockResolvedValue({} as CaseLog);
      emailService.sendCaseStatusNotification.mockResolvedValue();

      // Act
      const result = await service.updateStatus(
        mockCase.id,
        CaseStatus.IN_PROGRESS,
        mockCaseworker,
        'Starting work on this case',
      );

      // Assert
      expect(result.status).toBe(CaseStatus.IN_PROGRESS);
      expect(caseLogRepository.create).toHaveBeenCalledWith({
        case: mockCase,
        user: mockCaseworker,
        action: 'STATUS_CHANGED',
        description: 'Status changed from New to In Progress: Starting work on this case',
      });
      expect(emailService.sendCaseStatusNotification).toHaveBeenCalled();
    });

    it('should validate status transitions', async () => {
      // Arrange
      const completedCase = { ...mockCase, status: CaseStatus.COMPLETED };
      caseRepository.findOne.mockResolvedValue(completedCase);

      // Act & Assert
      await expect(service.updateStatus(
        completedCase.id,
        CaseStatus.NEW,
        mockCaseworker,
      )).rejects.toThrow(BadRequestException);
    });
  });
});