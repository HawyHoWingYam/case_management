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

export enum DocumentType {
  CONTRACT = 'contract',
  CORRESPONDENCE = 'correspondence',
  COURT_FILING = 'court_filing',
  EVIDENCE = 'evidence',
  ID_DOCUMENT = 'id_document',
  FINANCIAL = 'financial',
  MEDICAL = 'medical',
  OTHER = 'other',
}

export enum DocumentStatus {
  PENDING_REVIEW = 'pending_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ARCHIVED = 'archived',
}

@Entity('case_documents')
export class CaseDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Case, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'case_id' })
  case: Case;

  @Column({ name: 'case_id' })
  caseId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploaded_by' })
  uploadedBy: User;

  @Column({ name: 'uploaded_by' })
  uploadedById: string;

  @Column({ name: 'original_filename', length: 255 })
  originalFilename: string;

  @Column({ name: 'stored_filename', length: 255 })
  storedFilename: string;

  @Column({ name: 'file_path', length: 500 })
  filePath: string;

  @Column({ name: 'file_size' })
  fileSize: number;

  @Column({ name: 'mime_type', length: 100 })
  mimeType: string;

  @Column({
    type: 'enum',
    enum: DocumentType,
    default: DocumentType.OTHER,
  })
  type: DocumentType;

  @Column({
    type: 'enum',
    enum: DocumentStatus,
    default: DocumentStatus.PENDING_REVIEW,
  })
  status: DocumentStatus;

  @Column({ length: 500, nullable: true })
  description?: string;

  @Column({ name: 'is_confidential', default: false })
  isConfidential: boolean;

  @Column({ name: 'is_client_accessible', default: true })
  isClientAccessible: boolean;

  // Document verification
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'reviewed_by' })
  reviewedBy?: User;

  @Column({ name: 'reviewed_by', nullable: true })
  reviewedById?: string;

  @Column({ name: 'reviewed_at', type: 'timestamp', nullable: true })
  reviewedAt?: Date;

  @Column({ name: 'review_notes', type: 'text', nullable: true })
  reviewNotes?: string;

  // File integrity
  @Column({ name: 'file_hash', length: 64, nullable: true })
  fileHash?: string;

  @Column({ name: 'version', default: 1 })
  version: number;

  // Metadata for additional document information
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Helper methods
  get fileExtension(): string {
    return this.originalFilename.split('.').pop()?.toLowerCase() || '';
  }

  get fileSizeFormatted(): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = this.fileSize;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${Math.round(size * 100) / 100} ${units[unitIndex]}`;
  }

  canBeAccessedBy(user: User): boolean {
    // Uploader can always access
    if (this.uploadedById === user.id) return true;

    // Confidential documents
    if (this.isConfidential) {
      return user.hasRole('admin' as any) || user.hasRole('supervisor' as any);
    }

    // Client accessible documents
    if (this.isClientAccessible && user.hasRole('client' as any)) {
      // Client can only access their own case documents
      // This would need to be verified against the case ownership
      return true;
    }

    // Staff can access non-confidential documents
    return user.canAccessCase();
  }

  canBeEditedBy(user: User): boolean {
    // Only uploader, reviewers, and admins can edit
    return (
      this.uploadedById === user.id ||
      user.hasRole('admin' as any) ||
      user.hasRole('supervisor' as any)
    );
  }

  approve(reviewerId: string, notes?: string): void {
    this.status = DocumentStatus.APPROVED;
    this.reviewedById = reviewerId;
    this.reviewedAt = new Date();
    this.reviewNotes = notes;
  }

  reject(reviewerId: string, notes?: string): void {
    this.status = DocumentStatus.REJECTED;
    this.reviewedById = reviewerId;
    this.reviewedAt = new Date();
    this.reviewNotes = notes;
  }
}