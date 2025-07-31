import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { UserRole } from '../../common/enums';

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Exclude()
  @Column({ length: 255 })
  password: string;

  @Column({ name: 'first_name', length: 100 })
  firstName: string;

  @Column({ name: 'last_name', length: 100 })
  lastName: string;

  @Column({ name: 'phone_number', length: 20, nullable: true })
  phoneNumber?: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CLIENT,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @Column({ name: 'profile_image_url', nullable: true })
  profileImageUrl?: string;

  @Column({ name: 'last_login_at', type: 'timestamp', nullable: true })
  lastLoginAt?: Date;

  @Column({ name: 'email_verified', default: false })
  emailVerified: boolean;

  @Column({ name: 'email_verification_token', nullable: true })
  emailVerificationToken?: string;

  @Column({ name: 'password_reset_token', nullable: true })
  passwordResetToken?: string;

  @Column({ name: 'password_reset_expires', type: 'timestamp', nullable: true })
  passwordResetExpires?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Case relationships (lazy loading to avoid circular imports)
  @OneToMany('Case', 'client')
  clientCases: any[];

  @OneToMany('Case', 'assignedTo')
  assignedCases: any[];

  @OneToMany('Case', 'createdBy')
  createdCases: any[];

  @OneToMany('CaseNote', 'author')
  caseNotes: any[];

  @OneToMany('CaseDocument', 'uploadedBy')
  uploadedDocuments: any[];

  // Computed properties
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  // Helper methods
  isActive(): boolean {
    return this.status === UserStatus.ACTIVE;
  }

  hasRole(role: UserRole): boolean {
    return this.role === role;
  }

  canAccessCase(): boolean {
    return [UserRole.ADMIN, UserRole.CHAIR, UserRole.CASEWORKER, UserRole.SUPERVISOR, UserRole.CLERK].includes(this.role);
  }
}