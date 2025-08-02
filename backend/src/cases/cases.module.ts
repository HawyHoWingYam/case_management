import { Module, forwardRef } from '@nestjs/common';
import { CasesService } from './cases.service';
import { CasesController } from './cases.controller';
import { PrismaService } from '../prisma.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    forwardRef(() => NotificationsModule), // 使用forwardRef解决循环依赖
  ],
  controllers: [CasesController],
  providers: [CasesService, PrismaService],
  exports: [CasesService], // 导出服务供其他模块使用
})
export class CasesModule {}