import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { CaseStatus, CasePriority, CaseType } from '../../common/enums';

@Entity('cases')
export class Case {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'case_number', unique: true, length: 50 })
  caseNumber: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: CaseType,
    default: CaseType.CONSULTATION,
  })
  type: CaseType;

  @Column({
    type: 'enum',
    enum: CaseStatus,
    default: CaseStatus.NEW,
  })
  status: CaseStatus;

  @Column({
    type: 'enum',
    enum: CasePriority,
    default: CasePriority.MEDIUM,
  })
  priority: CasePriority;

  // Client relationship
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'client_id' })
  client: User;

  @Column({ name: 'client_id' })
  clientId: string;

  // Assigned caseworker
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assigned_to' })
  assignedTo?: User;

  @Column({ name: 'assigned_to', nullable: true })
  assignedToId?: string;

  // Created by (user who created the case)
  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @Column({ name: 'created_by' })
  createdById: string;

  @Column({ name: 'due_date', type: 'timestamp', nullable: true })
  dueDate?: Date;

  @Column({ name: 'closed_at', type: 'timestamp', nullable: true })
  closedAt?: Date;

  @Column({ name: 'closed_by', nullable: true })
  closedById?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'closed_by' })
  closedBy?: User;

  @Column({ name: 'closure_reason', type: 'text', nullable: true })
  closureReason?: string;

  // Metadata
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Computed properties
  get isOpen(): boolean {
    return this.status === CaseStatus.NEW || 
           this.status === CaseStatus.ASSIGNED || 
           this.status === CaseStatus.IN_PROGRESS ||
           this.status === CaseStatus.PENDING_REVIEW;
  }

  get isClosed(): boolean {
    return this.status === CaseStatus.CLOSED || this.status === CaseStatus.ARCHIVED;
  }

  get isOverdue(): boolean {
    if (!this.dueDate) return false;
    return new Date() > this.dueDate && this.isOpen;
  }

  // Helper methods
  canBeAssignedTo(user: User): boolean {
    return user.canAccessCase();
  }

  close(userId: string, reason?: string): void {
    this.status = CaseStatus.CLOSED;
    this.closedAt = new Date();
    this.closedById = userId;
    this.closureReason = reason;
  }

  reopen(): void {
    this.status = CaseStatus.NEW;
    this.closedAt = null;
    this.closedById = null;
    this.closureReason = null;
  }
}