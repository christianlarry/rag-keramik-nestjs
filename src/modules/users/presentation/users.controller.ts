import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/presentation/http/guard/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/presentation/http/guard/roles.guard';
import { Roles } from 'src/modules/auth/presentation/http/decorator/roles.decorator';
import { User } from 'src/modules/auth/presentation/http/decorator/user.decorator';
import { type RequestedUser } from 'src/modules/auth/presentation/http/interfaces/requested-user.interface';
import { Role } from '../domain/enums/role.enum';
import {
  GetCurrentUserProfileUseCase,
  UpdateCurrentUserProfileUseCase,
  GetAllUsersUseCase,
  GetUserByIdUseCase,
} from '../application/use-cases';
import {
  UpdateUserProfileDto,
  UserProfileResponseDto,
  UsersListResponseDto,
} from './dtos';

@ApiTags('Users')
@Controller('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(
    private readonly getCurrentUserProfileUseCase: GetCurrentUserProfileUseCase,
    private readonly updateCurrentUserProfileUseCase: UpdateCurrentUserProfileUseCase,
    private readonly getAllUsersUseCase: GetAllUsersUseCase,
    private readonly getUserByIdUseCase: GetUserByIdUseCase,
  ) { }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Retrieve the profile information of the currently authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully.',
    type: UserProfileResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token.',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found.',
  })
  async getCurrentUserProfile(
    @User() user: RequestedUser,
  ): Promise<UserProfileResponseDto> {
    const result = await this.getCurrentUserProfileUseCase.execute({
      userId: user.id,
    });

    return new UserProfileResponseDto({
      id: result.user.id,
      fullName: result.user.fullName,
      email: result.user.email,
      gender: result.user.gender,
      dateOfBirth: result.user.dateOfBirth,
      avatarUrl: result.user.avatarUrl,
      phoneNumber: result.user.phoneNumber,
      isPhoneVerified: result.user.isPhoneVerified,
      role: result.user.role,
      status: result.user.status,
      addresses: result.user.addresses.map((addr) => ({
        label: addr.label,
        street: addr.street,
        city: addr.city,
        state: addr.state,
        postalCode: addr.postalCode,
        country: addr.country,
        latitude: addr.latitude ?? undefined,
        longitude: addr.longitude ?? undefined,
        isDefault: addr.isDefault,
      })),
      createdAt: result.user.createdAt,
      updatedAt: result.user.updatedAt,
    });
  }

  @Patch('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update current user profile',
    description: 'Update the profile information of the currently authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile updated successfully.',
    type: UserProfileResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid input data.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token.',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found.',
  })
  async updateCurrentUserProfile(
    @User() user: RequestedUser,
    @Body() updateDto: UpdateUserProfileDto,
  ): Promise<UserProfileResponseDto> {
    const result = await this.updateCurrentUserProfileUseCase.execute({
      userId: user.id,
      fullName: updateDto.fullName,
      email: updateDto.email,
      gender: updateDto.gender,
      dateOfBirth: updateDto.dateOfBirth,
      avatarUrl: updateDto.avatarUrl,
      phoneNumber: updateDto.phoneNumber,
    });

    return new UserProfileResponseDto({
      id: result.user.id,
      fullName: result.user.fullName,
      email: result.user.email,
      gender: result.user.gender,
      dateOfBirth: result.user.dateOfBirth,
      avatarUrl: result.user.avatarUrl,
      phoneNumber: result.user.phoneNumber,
      isPhoneVerified: result.user.isPhoneVerified,
      role: result.user.role,
      status: result.user.status,
      updatedAt: result.user.updatedAt,
    });
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({
    summary: 'List all users [ADMIN]',
    description: 'Retrieve a paginated list of all users. Admin and staff only.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (1-indexed)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
    example: 10,
  })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: Role,
    description: 'Filter by user role',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    description: 'Filter by user status',
  })
  @ApiResponse({
    status: 200,
    description: 'Users list retrieved successfully.',
    type: UsersListResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions.',
  })
  async getAllUsers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('role') role?: string,
    @Query('status') status?: string,
  ): Promise<UsersListResponseDto> {
    const result = await this.getAllUsersUseCase.execute({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      role,
      status,
    });

    return new UsersListResponseDto({
      data: result.users.map(
        (user) =>
          new UserProfileResponseDto({
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            gender: user.gender as any,
            dateOfBirth: user.dateOfBirth ?? undefined,
            avatarUrl: user.avatarUrl ?? undefined,
            phoneNumber: user.phoneNumber ?? undefined,
            isPhoneVerified: user.isPhoneVerified,
            role: user.role as any,
            status: user.status as any,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          }),
      ),
      meta: {
        currentPage: result.pagination.currentPage,
        itemsPerPage: result.pagination.itemsPerPage,
        totalItems: result.pagination.totalItems,
        totalPages: result.pagination.totalPages,
        hasNextPage: result.pagination.hasNextPage,
        hasPreviousPage: result.pagination.hasPreviousPage,
      },
    });
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({
    summary: 'Get user by ID [ADMIN]',
    description: 'Retrieve detailed information of a specific user by ID. Admin and staff only.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'User ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'User retrieved successfully.',
    type: UserProfileResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions.',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found.',
  })
  async getUserById(@Param('id') id: string): Promise<UserProfileResponseDto> {
    const result = await this.getUserByIdUseCase.execute({
      userId: id,
    });

    return new UserProfileResponseDto({
      id: result.user.id,
      fullName: result.user.fullName,
      email: result.user.email,
      gender: result.user.gender as any,
      dateOfBirth: result.user.dateOfBirth ?? undefined,
      avatarUrl: result.user.avatarUrl ?? undefined,
      phoneNumber: result.user.phoneNumber ?? undefined,
      isPhoneVerified: result.user.isPhoneVerified,
      role: result.user.role as any,
      status: result.user.status as any,
      addresses: result.user.addresses.map((addr) => ({
        label: addr.label as any,
        street: addr.street,
        city: addr.city,
        state: addr.state,
        postalCode: addr.postalCode,
        country: addr.country,
        latitude: addr.latitude ?? undefined,
        longitude: addr.longitude ?? undefined,
        isDefault: addr.isDefault,
      })),
      createdAt: result.user.createdAt,
      updatedAt: result.user.updatedAt,
    });
  }
}
