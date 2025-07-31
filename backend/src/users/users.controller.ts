import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  ParseIntPipe,
  UseGuards,
  ClassSerializerInterceptor,
  UseInterceptors,
  HttpStatus,
  ParseEnumPipe,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserStatus } from './entities/user.entity';
import { UserRole } from '../common/enums';

@UseGuards(ThrottlerGuard)
@UseInterceptors(ClassSerializerInterceptor)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  async findAll(
    @Query('role', new ParseEnumPipe(UserRole, { optional: true })) role?: UserRole,
    @Query('status', new ParseEnumPipe(UserStatus, { optional: true })) status?: UserStatus,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
  ) {
    return this.usersService.findAll(role, status, page, limit);
  }

  @Get('stats')
  async getStats() {
    const [countByRole, activeUsersCount] = await Promise.all([
      this.usersService.countByRole(),
      this.usersService.getActiveUsersCount(),
    ]);

    return {
      countByRole,
      activeUsersCount,
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<User> {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.update(id, updateUserDto);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status', new ParseEnumPipe(UserStatus)) status: UserStatus,
  ): Promise<User> {
    return this.usersService.updateStatus(id, status);
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.usersService.remove(id);
  }
}