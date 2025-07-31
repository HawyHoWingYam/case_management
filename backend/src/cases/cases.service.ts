import { Injectable, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Case } from './entities/case.entity';
import { User } from '../users/entities/user.entity';
import { CaseLog } from '../entities/case-log.entity';
import { EmailService } from '../email/email.service';
import { CreateCaseDto } from './dto/create-case.dto';
import { CaseStatus, CasePriority, UserRole } from '../common/enums';

interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface FindAllOptions {
  page: number;
  limit: number;
  status?: CaseStatus;
}

@Injectable()
export class CasesService {
  private readonly logger = new Logger(CasesService.name);
  private readonly MAX_CASES_PER_WORKER = 5;

  constructor(
    @InjectRepository(Case)
    private caseRepository: Repository<Case>,
    @InjectRepository(CaseLog)
    private caseLogRepository: Repository<CaseLog>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private emailService: EmailService,
  ) {}

  async create(createCaseDto: CreateCaseDto, createdBy: User): Promise<Case> {
    this.logger.log(`Creating new case: ${createCaseDto.title} by user ${createdBy.id}`);

    try {
      // Validate due date is in the future
      if (createCaseDto.due_date && new Date(createCaseDto.due_date) <= new Date()) {
        throw new BadRequestException('Due date must be in the future');
      }

      // Generate unique case number
      const caseNumber = await this.generateCaseNumber();

      const newCase = this.caseRepository.create({
        ...createCaseDto,
        caseNumber,
        createdBy: createdBy,
        createdById: createdBy.id,
        status: CaseStatus.NEW,
        // Set client if provided, otherwise use the creator as client if they're a client
        ...(createCaseDto.clientId ? 
          { clientId: createCaseDto.clientId } : 
          createdBy.role === UserRole.CLIENT ? { clientId: createdBy.id, client: createdBy } : {}
        ),
      });

      const savedCase = await this.caseRepository.save(newCase);
      this.logger.log(`Case created successfully with ID: ${savedCase.id} and case number: ${caseNumber}`);

      // Create log entry
      const logEntry = this.caseLogRepository.create({
        case: savedCase,
        user: createdBy,
        action: 'CASE_CREATED',
        description: 'Case created',
      });
      await this.caseLogRepository.save(logEntry);

      return this.caseRepository.findOne({
        where: { id: savedCase.id },
        relations: ['createdBy', 'client', 'assignedTo'],
      });
    } catch (error) {
      this.logger.error(`Failed to create case: ${createCaseDto.title}`, error instanceof Error ? error.stack : error);
      throw error;
    }
  }

  async assignCase(caseId: string, caseworkerId: string, assignedBy: User): Promise<Case> {
    this.logger.log(`Assigning case ${caseId} to caseworker ${caseworkerId} by user ${assignedBy.id}`);

    try {
      // Only chairs and admins can assign cases
      if (![UserRole.CHAIR, UserRole.ADMIN].includes(assignedBy.role)) {
        throw new ForbiddenException('Only chairs and admins can assign cases');
      }

      const case_ = await this.caseRepository.findOne({
        where: { id: caseId },
        relations: ['createdBy', 'assignedTo', 'client'],
      });

      if (!case_) {
        throw new BadRequestException('Case not found');
      }

      // Cannot assign completed or closed cases
      if ([CaseStatus.COMPLETED, CaseStatus.CLOSED, CaseStatus.ARCHIVED].includes(case_.status)) {
        throw new BadRequestException('Cannot assign completed, closed, or archived cases');
      }

      const caseworker = await this.userRepository.findOne({
        where: { id: caseworkerId },
      });

      if (!caseworker) {
        throw new BadRequestException('Caseworker not found');
      }

      // Validate caseworker role
      if (![UserRole.CASEWORKER, UserRole.SUPERVISOR, UserRole.ADMIN].includes(caseworker.role)) {
        throw new BadRequestException('Selected user cannot be assigned cases');
      }

      // Check case load limit - count active cases assigned to this caseworker
      const currentCaseLoad = await this.caseRepository.count({
        where: { 
          assignedToId: caseworkerId,
          status: In([
            CaseStatus.NEW,
            CaseStatus.ASSIGNED,
            CaseStatus.IN_PROGRESS,
            CaseStatus.PENDING_REVIEW,
            CaseStatus.PENDING_CLIENT_RESPONSE,
            CaseStatus.ON_HOLD
          ])
        },
      });

      if (currentCaseLoad >= this.MAX_CASES_PER_WORKER) {
        throw new BadRequestException(`Caseworker has reached maximum case load (${this.MAX_CASES_PER_WORKER} active cases)`);
      }

      // Update case
      case_.assignedTo = caseworker;
      case_.assignedToId = caseworkerId;
      case_.status = CaseStatus.ASSIGNED;
      const updatedCase = await this.caseRepository.save(case_);

      // Create log entry
      const logEntry = this.caseLogRepository.create({
        case: case_,
        user: assignedBy,
        action: 'CASE_ASSIGNED',
        description: `Case assigned to ${caseworker.firstName} ${caseworker.lastName}`,
      });
      await this.caseLogRepository.save(logEntry);

      this.logger.log(`Case ${caseId} successfully assigned to ${caseworker.fullName}`);

      // Send notification
      await this.emailService.sendCaseAssignmentNotification(updatedCase, caseworker, assignedBy);

      return updatedCase;
    } catch (error) {
      this.logger.error(`Failed to assign case ${caseId} to caseworker ${caseworkerId}`, error instanceof Error ? error.stack : error);
      throw error;
    }
  }

  async findAll(options: FindAllOptions): Promise<PaginatedResult<Case>> {
    const { page, limit, status } = options;
    const skip = (page - 1) * limit;

    const whereConditions: any = {};
    if (status) {
      whereConditions.status = status;
    }

    const [cases, total] = await this.caseRepository.findAndCount({
      where: whereConditions,
      relations: ['createdBy', 'assignedTo'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: cases,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateStatus(
    caseId: string,
    newStatus: CaseStatus,
    updatedBy: User,
    comment?: string,
  ): Promise<Case> {
    this.logger.log(`Updating case ${caseId} status to ${newStatus} by user ${updatedBy.id}`);

    try {
      const case_ = await this.caseRepository.findOne({
        where: { id: caseId },
        relations: ['createdBy', 'assignedTo', 'client'],
      });

      if (!case_) {
        throw new BadRequestException('Case not found');
      }

      // Validate status transitions
      if (case_.status === CaseStatus.COMPLETED && newStatus === CaseStatus.NEW) {
        throw new BadRequestException('Cannot reopen completed cases');
      }

      if (case_.status === CaseStatus.ARCHIVED) {
        throw new BadRequestException('Cannot change status of archived cases');
      }

      const previousStatus = case_.status;
      case_.status = newStatus;

      // Set closure information if case is being closed or completed
      if ([CaseStatus.CLOSED, CaseStatus.COMPLETED].includes(newStatus)) {
        case_.closedAt = new Date();
        case_.closedById = updatedBy.id;
        case_.closedBy = updatedBy;
        if (comment) {
          case_.closureReason = comment;
        }
      }

      const updatedCase = await this.caseRepository.save(case_);

      // Create log entry
      const statusText = {
        [CaseStatus.NEW]: 'New',
        [CaseStatus.PENDING_REVIEW]: 'Pending Review',
        [CaseStatus.ASSIGNED]: 'Assigned',
        [CaseStatus.IN_PROGRESS]: 'In Progress',
        [CaseStatus.PENDING_CLIENT_RESPONSE]: 'Pending Client Response',
        [CaseStatus.ON_HOLD]: 'On Hold',
        [CaseStatus.COMPLETED]: 'Completed',
        [CaseStatus.CLOSED]: 'Closed',
        [CaseStatus.ARCHIVED]: 'Archived',
      };

      const description = `Status changed from ${statusText[previousStatus]} to ${statusText[newStatus]}${comment ? ': ' + comment : ''}`;
      
      const logEntry = this.caseLogRepository.create({
        case: case_,
        user: updatedBy,
        action: 'STATUS_CHANGED',
        description,
      });
      await this.caseLogRepository.save(logEntry);

      this.logger.log(`Case ${caseId} status successfully updated from ${previousStatus} to ${newStatus}`);

      // Send notification
      await this.emailService.sendCaseStatusNotification(updatedCase, previousStatus, newStatus, updatedBy);

      return updatedCase;
    } catch (error) {
      this.logger.error(`Failed to update case ${caseId} status to ${newStatus}`, error instanceof Error ? error.stack : error);
      throw error;
    }
  }

  /**
   * Generate unique case number
   */
  private async generateCaseNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `CASE-${year}`;
    
    try {
      // Find the latest case number for this year
      const latestCase = await this.caseRepository
        .createQueryBuilder('case')
        .where('case.caseNumber LIKE :prefix', { prefix: `${prefix}%` })
        .orderBy('case.caseNumber', 'DESC')
        .getOne();

      let sequence = 1;
      if (latestCase) {
        const lastNumber = latestCase.caseNumber.split('-').pop();
        sequence = parseInt(lastNumber, 10) + 1;
      }

      return `${prefix}-${sequence.toString().padStart(4, '0')}`;
    } catch (error) {
      // Fallback to timestamp-based case number if query builder fails
      const timestamp = Date.now();
      return `${prefix}-${timestamp.toString().slice(-4)}`;
    }
  }

  /**
   * Find case by ID with all relations
   */
  async findOne(id: string): Promise<Case> {
    this.logger.log(`Finding case with ID: ${id}`);
    
    const case_ = await this.caseRepository.findOne({
      where: { id },
      relations: ['createdBy', 'assignedTo', 'client', 'closedBy'],
    });

    if (!case_) {
      throw new BadRequestException('Case not found');
    }

    return case_;
  }

  /**
   * Get case logs for audit trail
   */
  async getCaseLogs(caseId: string): Promise<CaseLog[]> {
    return this.caseLogRepository.find({
      where: { caseId },
      relations: ['user'],
      order: { created_at: 'DESC' },
    });
  }
}