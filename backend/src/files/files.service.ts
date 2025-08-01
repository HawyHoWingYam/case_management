import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);
  private readonly minioClient: Minio.Client;
  private readonly bucketName = 'case-files';

  constructor(private configService: ConfigService) {
    // 初始化 MinIO 客户端
    this.minioClient = new Minio.Client({
      endPoint: this.configService.get('MINIO_ENDPOINT', 'localhost'),
      port: parseInt(this.configService.get('MINIO_PORT', '9000')),
      useSSL: this.configService.get('MINIO_USE_SSL', 'false') === 'true',
      accessKey: this.configService.get('MINIO_ACCESS_KEY', 'minio'),
      secretKey: this.configService.get('MINIO_SECRET_KEY', 'minio123'),
    });

    this.initializeBucket();
  }

  /**
   * 初始化存储桶
   */
  private async initializeBucket() {
    try {
      const bucketExists = await this.minioClient.bucketExists(this.bucketName);
      
      if (!bucketExists) {
        await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
        this.logger.log(`Bucket '${this.bucketName}' created successfully`);

        // 设置存储桶策略，允许公共读取
        const policy = {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${this.bucketName}/*`],
            },
          ],
        };

        await this.minioClient.setBucketPolicy(
          this.bucketName,
          JSON.stringify(policy),
        );
        this.logger.log(`Bucket policy set for '${this.bucketName}'`);
      } else {
        this.logger.log(`Bucket '${this.bucketName}' already exists`);
      }
    } catch (error) {
      this.logger.error(`Error initializing bucket: ${error.message}`, error.stack);
    }
  }

  /**
   * 上传文件
   */
  async uploadFile(file: Express.Multer.File): Promise<any> {
    try {
      // 验证文件
      this.validateFile(file);

      // 生成唯一文件名
      const fileExtension = path.extname(file.originalname);
      const fileName = `${uuidv4()}${fileExtension}`;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const uniqueFileName = `${timestamp}_${fileName}`;

      // 设置文件元数据
      const metadata = {
        'Content-Type': file.mimetype,
        'X-Original-Name': file.originalname,
        'X-Upload-Date': new Date().toISOString(),
      };

      // 上传到 MinIO
      await this.minioClient.putObject(
        this.bucketName,
        uniqueFileName,
        file.buffer,
        file.size,
        metadata,
      );

      // 生成访问URL
      const fileUrl = `http://${this.configService.get('MINIO_ENDPOINT', 'localhost')}:${this.configService.get('MINIO_PORT', '9000')}/${this.bucketName}/${uniqueFileName}`;

      this.logger.log(`File uploaded successfully: ${uniqueFileName}`);

      return {
        filename: uniqueFileName,
        originalname: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        url: fileUrl,
        uploadedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Error uploading file: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 上传多个文件
   */
  async uploadFiles(files: Express.Multer.File[]): Promise<any[]> {
    const uploadPromises = files.map(file => this.uploadFile(file));
    return Promise.all(uploadPromises);
  }

  /**
   * 删除文件
   */
  async deleteFile(fileName: string): Promise<void> {
    try {
      await this.minioClient.removeObject(this.bucketName, fileName);
      this.logger.log(`File deleted successfully: ${fileName}`);
    } catch (error) {
      this.logger.error(`Error deleting file: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 获取文件信息
   */
  async getFileInfo(fileName: string): Promise<any> {
    try {
      const stat = await this.minioClient.statObject(this.bucketName, fileName);
      const fileUrl = `http://${this.configService.get('MINIO_ENDPOINT', 'localhost')}:${this.configService.get('MINIO_PORT', '9000')}/${this.bucketName}/${fileName}`;

      return {
        filename: fileName,
        size: stat.size,
        etag: stat.etag,
        lastModified: stat.lastModified,
        url: fileUrl,
        metadata: stat.metaData,
      };
    } catch (error) {
      this.logger.error(`Error getting file info: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 获取文件下载URL（预签名URL，有时效性）
   */
  async getDownloadUrl(fileName: string, expiry: number = 60 * 60): Promise<string> {
    try {
      const url = await this.minioClient.presignedGetObject(
        this.bucketName,
        fileName,
        expiry,
      );
      return url;
    } catch (error) {
      this.logger.error(`Error generating download URL: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 验证文件
   */
  private validateFile(file: Express.Multer.File): void {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
    ];

    if (file.size > maxSize) {
      throw new BadRequestException('文件大小不能超过10MB');
    }

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('不支持的文件类型');
    }
  }
}