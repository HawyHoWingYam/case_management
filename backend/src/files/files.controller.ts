import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  UseGuards,
  Request,
  Query,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FileUploadDto } from './dto/file-upload.dto';

@ApiTags('文件管理')
@Controller('files')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: '上传单个文件' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: FileUploadDto,
    description: '文件上传',
  })
  @ApiResponse({
    status: 201,
    description: '文件上传成功',
    schema: {
      type: 'object',
      properties: {
        filename: { type: 'string', example: '2025-08-01T12-30-00-000Z_abc-123.pdf' },
        originalname: { type: 'string', example: 'document.pdf' },
        mimetype: { type: 'string', example: 'application/pdf' },
        size: { type: 'number', example: 1024 },
        url: { type: 'string', example: 'http://localhost:9000/case-files/2025-08-01T12-30-00-000Z_abc-123.pdf' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '文件类型不支持或文件大小超限',
  })
  @ApiResponse({
    status: 401,
    description: '未授权访问',
  })
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Request() req) {
    if (!file) {
      throw new BadRequestException('请选择要上传的文件');
    }
    
    return this.filesService.uploadFile(file);
  }

  @Post('upload/multiple')
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiOperation({ summary: '上传多个文件' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
    description: '多文件上传',
  })
  @ApiResponse({
    status: 201,
    description: '文件上传成功',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          originalname: { type: 'string' },
          mimetype: { type: 'string' },
          size: { type: 'number' },
          url: { type: 'string' },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '文件类型不支持或文件大小超限',
  })
  @ApiResponse({
    status: 401,
    description: '未授权访问',
  })
  async uploadFiles(@UploadedFiles() files: Express.Multer.File[], @Request() req) {
    if (!files || files.length === 0) {
      throw new BadRequestException('请选择要上传的文件');
    }
    
    return this.filesService.uploadFiles(files);
  }

  @Get(':filename/info')
  @ApiOperation({ summary: '获取文件信息' })
  @ApiParam({
    name: 'filename',
    description: '文件名',
    type: 'string',
    example: '2025-08-01T12-30-00-000Z_abc-123.pdf',
  })
  @ApiResponse({
    status: 200,
    description: '获取文件信息成功',
    schema: {
      type: 'object',
      properties: {
        filename: { type: 'string' },
        size: { type: 'number' },
        lastModified: { type: 'string' },
        contentType: { type: 'string' },
        metadata: { type: 'object' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '文件不存在',
  })
  @ApiResponse({
    status: 401,
    description: '未授权访问',
  })
  async getFileInfo(@Param('filename') filename: string, @Request() req) {
    return this.filesService.getFileInfo(filename);
  }

  @Get(':filename/download')
  @ApiOperation({ summary: '获取文件下载链接' })
  @ApiParam({
    name: 'filename',
    description: '文件名',
    type: 'string',
    example: '2025-08-01T12-30-00-000Z_abc-123.pdf',
  })
  @ApiQuery({
    name: 'expiry',
    description: '链接有效期（秒），默认3600秒（1小时）',
    type: 'number',
    required: false,
    example: 3600,
  })
  @ApiResponse({
    status: 200,
    description: '获取下载链接成功',
    schema: {
      type: 'object',
      properties: {
        downloadUrl: { type: 'string', example: 'http://localhost:9000/case-files/file.pdf?X-Amz-Algorithm=...' },
        expiresAt: { type: 'string', example: '2025-08-01T13:30:00.000Z' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '文件不存在',
  })
  @ApiResponse({
    status: 401,
    description: '未授权访问',
  })
  async getDownloadUrl(
    @Param('filename') filename: string,
    @Query('expiry') expiry?: number,
    @Request() req?,
  ) {
    const downloadUrl = await this.filesService.getDownloadUrl(filename, expiry);
    const expirySeconds = expiry || 3600;
    const expiresAt = new Date(Date.now() + expirySeconds * 1000).toISOString();
    
    return {
      downloadUrl,
      expiresAt,
    };
  }

  @Delete(':filename')
  @ApiOperation({ summary: '删除文件' })
  @ApiParam({
    name: 'filename',
    description: '文件名',
    type: 'string',
    example: '2025-08-01T12-30-00-000Z_abc-123.pdf',
  })
  @ApiResponse({
    status: 200,
    description: '文件删除成功',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: '文件删除成功' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '文件不存在',
  })
  @ApiResponse({
    status: 401,
    description: '未授权访问',
  })
  async deleteFile(@Param('filename') filename: string, @Request() req) {
    await this.filesService.deleteFile(filename);
    return { message: '文件删除成功' };
  }
}