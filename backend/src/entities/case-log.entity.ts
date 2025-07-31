import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Case } from '../cases/entities/case.entity';
import { User } from '../users/entities/user.entity';

@Entity('case_logs')
export class CaseLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Case)
  @JoinColumn({ name: 'case_id' })
  case: Case;

  @Column({ name: 'case_id' })
  caseId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ length: 100 })
  action: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}