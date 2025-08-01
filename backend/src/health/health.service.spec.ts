import { Test, TestingModule } from '@nestjs/testing';
import { HealthService } from './health.service';
import { PrismaService } from '../prisma/prisma.service';

describe('HealthService', () => {
  let service: HealthService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    healthCheck: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getBasicHealth', () => {
    it('should return basic health status', async () => {
      const result = await service.getBasicHealth();

      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('uptime');
      expect(typeof result.uptime).toBe('number');
      expect(result.uptime).toBeGreaterThan(0);
    });

    it('should return valid ISO timestamp', async () => {
      const result = await service.getBasicHealth();

      expect(() => new Date(result.timestamp)).not.toThrow();
      expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
    });
  });

  describe('getDetailedHealth', () => {
    it('should return detailed health with database status', async () => {
      mockPrismaService.healthCheck.mockResolvedValue({
        status: 'connected',
        responseTime: 25,
      });

      const result = await service.getDetailedHealth();

      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('services');
      expect(result.services).toHaveProperty('database');
      expect(result.services).toHaveProperty('memory');

      expect(result.services.database.status).toBe('connected');
      expect(result.services.database.responseTime).toBe(25);

      expect(result.services.memory).toHaveProperty('used');
      expect(result.services.memory).toHaveProperty('total');
      expect(result.services.memory).toHaveProperty('unit', 'MB');
      expect(typeof result.services.memory.used).toBe('number');
      expect(typeof result.services.memory.total).toBe('number');
    });

    it('should handle database connection failure', async () => {
      mockPrismaService.healthCheck.mockResolvedValue({
        status: 'disconnected',
      });

      const result = await service.getDetailedHealth();

      expect(result.services.database.status).toBe('disconnected');
      expect(result.services.database.responseTime).toBeUndefined();
    });

    it('should calculate memory usage correctly', async () => {
      mockPrismaService.healthCheck.mockResolvedValue({
        status: 'connected',
        responseTime: 30,
      });

      const result = await service.getDetailedHealth();

      const memoryUsage = process.memoryUsage();
      const expectedUsed = Math.round(memoryUsage.heapUsed / 1024 / 1024);
      const expectedTotal = Math.round(memoryUsage.heapTotal / 1024 / 1024);

      expect(result.services.memory.used).toBe(expectedUsed);
      expect(result.services.memory.total).toBe(expectedTotal);
    });
  });
});