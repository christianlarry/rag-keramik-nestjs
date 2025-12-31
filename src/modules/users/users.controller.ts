import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Role } from 'src/generated/prisma';

@ApiTags('Users')
@Controller('v1/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiBearerAuth()
  // @UseGuards(JwtAuthGuard) // Uncomment when auth implemented
  async getProfile(@Request() req) {
    // req.user.id dari JWT token
    return this.usersService.findById(req.user?.id || 'test-id');
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiBearerAuth()
  // @UseGuards(JwtAuthGuard)
  async updateProfile(
    @Request() req,
    @Body() data: { name?: string; email?: string },
  ) {
    return this.usersService.update(req.user?.id || 'test-id', data);
  }

  @Get()
  @ApiOperation({ summary: 'List all users [ADMIN]' })
  @ApiBearerAuth()
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'role', required: false, enum: Role })
  @ApiQuery({ name: 'search', required: false, type: String })
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(Role.ADMIN)
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('role') role?: Role,
    @Query('search') search?: string,
  ) {
    return this.usersService.findAll({
      page: page ? +page : 1,
      limit: limit ? +limit : 20,
      role,
      search,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID [ADMIN]' })
  @ApiBearerAuth()
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(Role.ADMIN)
  async findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }
}
