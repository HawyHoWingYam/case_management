import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Case } from './case.entity';

export enum NoteType {
  GENERAL = 'general',
  PHONE_CALL = 'phone_call',
  MEETING = 'meeting',
  EMAIL = 'email',
  COURT_APPEARANCE = 'court_appearance',
  DOCUMENT_REVIEW = 'document_review',
  FOLLOW_UP = 'follow_up',
  INTERNAL = 'internal',
}

@Entity('case_notes')
export class CaseNote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Case, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'case_id' })
  case: Case;

  @Column({ name: 'case_id' })
  caseId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'author_id' })
  author: User;

  @Column({ name: 'author_id' })
  authorId: string;

  @Column({
    type: 'enum',
    enum: NoteType,
    default: NoteType.GENERAL,
  })
  type: NoteType;

  @Column({ length: 255, nullable: true })
  title?: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'is_confidential', default: false })
  isConfidential: boolean;

  @Column({ name: 'is_billable', default: false })
  isBillable: boolean;

  @Column({ name: 'billable_hours', type: 'decimal', precision: 4, scale: 2, nullable: true })
  billableHours?: number;

  @Column({ name: 'contact_date', type: 'timestamp', nullable: true })
  contactDate?: Date;

  // Metadata for structured information
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Helper methods
  canBeViewedBy(user: User): boolean {
    // Authors can always view their notes
    if (this.authorId === user.id) return true;
    
    // Confidential notes can only be viewed by author and admins
    if (this.isConfidential) {
      return user.hasRole('admin' as any);
    }
    
    // Non-confidential notes can be viewed by users who can access cases
    return user.canAccessCase();
  }

  canBeEditedBy(user: User): boolean {
    // Only author and admins can edit notes
    return this.authorId === user.id || user.hasRole('admin' as any);
  }
}