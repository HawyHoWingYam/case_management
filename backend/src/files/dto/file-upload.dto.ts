import { ApiProperty } from '@nestjs/swagger';

export class FileUploadDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: '要上传的文件',
  })
  file: Express.Multer.File;
}

export class FileUploadResponseDto {
  @ApiProperty({
    description: '文件名',
    example: 'document_20250801_103045.pdf',
  })
  filename: string;

  @ApiProperty({
    description: '原始文件名',
    example: 'user_document.pdf',
  })
  originalname: string;

  @ApiProperty({
    description: '文件大小（字节）',
    example: 1024000,
  })
  size: number;

  @ApiProperty({
    description: '文件MIME类型',
    example: 'application/pdf',
  })
  mimetype: string;

  @ApiProperty({
    description: '文件访问URL',
    example: 'http://localhost:9000/case-files/document_20250801_103045.pdf',
  })
  url: string;

  @ApiProperty({
    description: '上传时间',
    example: '2025-08-01T10:30:45.000Z',
  })
  uploadedAt: Date;
}