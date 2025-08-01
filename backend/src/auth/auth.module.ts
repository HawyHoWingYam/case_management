import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { APP_GUARD } from '@nestjs/core';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies';
import { JwtAuthGuard, RolesGuard } from './guards';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    // Prisma module for database access
    PrismaModule,
    
    // Passport module for authentication strategies
    PassportModule.register({ defaultStrategy: 'jwt' }),
    
    // JWT module configuration
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '1h'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    // Global guards - applied to all routes by default
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  exports: [
    AuthService,
    JwtStrategy,
    PassportModule,
    JwtModule,
  ],
})
export class AuthModule {}