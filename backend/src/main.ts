import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
// import { ValidationPipe } from '@nestjs/common';
// import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
// import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
// import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Global validation pipe (commented out for basic startup test)
  // app.useGlobalPipes(
  //   new ValidationPipe({
  //     whitelist: true,
  //     forbidNonWhitelisted: true,
  //     transform: true,
  //     transformOptions: {
  //       enableImplicitConversion: true,
  //     },
  //   }),
  // );

  // Global exception filter (commented out for basic startup test)
  // app.useGlobalFilters(new AllExceptionsFilter());

  // Global logging interceptor (commented out for basic startup test)
  // app.useGlobalInterceptors(new LoggingInterceptor());

  // CORS configuration
  app.enableCors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3001',
      'http://localhost:3001',
      'http://localhost:3000', // Fallback for different frontend ports
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'Cache-Control',
      'X-HTTP-Method-Override',
    ],
    exposedHeaders: ['Authorization'],
    credentials: true,
    optionsSuccessStatus: 200, // For legacy browser support
  });

  // Swagger API documentation (commented out for basic startup test)
  // const config = new DocumentBuilder()
  //   .setTitle('Case Management API')
  //   .setDescription('API documentation for Case Management System')
  //   .setVersion('1.0')
  //   .addBearerAuth()
  //   .build();
  // const document = SwaggerModule.createDocument(app, config);
  // SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3002;
  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`Basic NestJS application started successfully!`);
}

bootstrap().catch((error) => {
  Logger.error('Failed to start application', error);
  process.exit(1);
});