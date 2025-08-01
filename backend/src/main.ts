import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 启用全局验证管道
  app.useGlobalPipes(new ValidationPipe());
  
  // 启用 CORS（允许前端调用）
  app.enableCors({
    origin: ['http://localhost:3000'], // Next.js 默认端口
    credentials: true,
  });
  
  // 配置 Swagger
  const config = new DocumentBuilder()
    .setTitle('Case Management System API')
    .setDescription('API documentation for the Case Management System')
    .setVersion('1.0')
    .addTag('系统信息')
    .addTag('认证')
    .addTag('cases')
    .addTag('users')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth', // This name here is important for matching up with @ApiBearerAuth() in your controller!
    )
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  
  // 设置全局 API 前缀
  app.setGlobalPrefix('api');
  
  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Backend server is running on http://localhost:${port}`);
  console.log(`📚 API documentation available at http://localhost:${port}/api/docs`);
}
bootstrap();