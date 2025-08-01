import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';

@Module({
  imports: [
    MulterModule.register({
      // 使用内存存储，文件会被存储在内存中作为 Buffer
      // 这样我们可以直接将 buffer 传递给 MinIO
      dest: undefined, // 使用内存存储
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 10, // 最多10个文件
      },
    }),
  ],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}