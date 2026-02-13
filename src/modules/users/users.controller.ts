import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { User } from 'src/modules/auth/presentation/http/decorator/user.decorator';
import { JwtAuthGuard } from 'src/modules/auth/presentation/http/guard/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/modules/auth/presentation/http/decorator/roles.decorator';
import { Role } from './domain/enums/role.enum';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getProfile(
    @User('id') currentUserId: string,
  ) {
    return this.usersService.findById(currentUserId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @User('id') currentUserId: string,
    @Body() data: { firstName?: string; },
  ) {
    return this.usersService.update(currentUserId, data);
  }

  @Get()
  @ApiOperation({ summary: 'List all users [ADMIN]' })
  @ApiBearerAuth()
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'role', required: false, enum: Role })
  @ApiQuery({ name: 'search', required: false, type: String })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('role') role?: Role,
    @Query('search') search?: string,
  ) {
    return this.usersService.findAll({
      page: page ? +page : 1,
      limit: limit ? +limit : 20,
      role: undefined,
      search,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID [ADMIN]' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }
}
