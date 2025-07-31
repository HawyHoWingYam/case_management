import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CasesController } from './cases.controller';
import { CasesService } from './cases.service';
import { Case } from './entities/case.entity';
import { CaseLog } from '../entities/case-log.entity';
import { User } from '../users/entities/user.entity';
import { EmailService } from '../email/email.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Case, CaseLog, User]),
  ],
  controllers: [CasesController],
  providers: [CasesService, EmailService],
  exports: [CasesService],
})
export class CasesModule {}