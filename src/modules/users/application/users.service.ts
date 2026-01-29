import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from 'src/config/config.type';
import {
  User,
  UserSearchCriteria,
  PagedResult,
  OAuthUserData,
  UpdateUserParams,
  RemoveOptions,
  CreateUserProps,
} from '../domain';
import { UserEmailAlreadyExistsError, UserNotFoundError } from '../domain/errors';
import { UserRepository } from '../infrastructure/repositories/user.repository';
import { UserQueryRepository } from '../infrastructure/repositories/user-query,repository';
import { CacheService } from '../../../infrastructure/cache/cache.service';
import { UserCacheKeys } from '../infrastructure/cache';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly userQueryRepository: UserQueryRepository,
    private readonly configService: ConfigService<AllConfigType>,
    private readonly cacheService: CacheService,
  ) { }

  // =====================================================
  // Query Operations
  // =====================================================

  /**
   * Find user by ID
   * @throws UserNotFoundError if user not found
   */
  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new UserNotFoundError({ field: 'id', value: id });
    }
    return user;
  }

  /**
   * Find user by email
   * @throws UserNotFoundError if user not found
   */
  async findByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new UserNotFoundError({ field: 'email', value: email });
    }
    return user;
  }

  /**
   * Get all users with pagination and filtering
   */
  async findMany(criteria: UserSearchCriteria): Promise<PagedResult<User>> {
    return this.userQueryRepository.findMany(criteria);
  }

  /**
   * Count users based on criteria
   */
  async count(criteria?: UserSearchCriteria): Promise<number> {
    return this.userQueryRepository.count(criteria);
  }

  /**
   * Check if an email already exists
   */
  async isEmailExists(email: string): Promise<boolean> {
    return this.userQueryRepository.checkEmailExists(email);
  }

  /**
   * Check if user exists by ID
   */
  async exists(id: string): Promise<boolean> {
    return this.userQueryRepository.exists(id);
  }

  // =====================================================
  // Command Operations
  // =====================================================

  /**
   * Create new user
   */
  async create(data: CreateUserProps): Promise<User> {
    // Check if email already exists
    const emailExists = await this.userRepository.existsByEmail(data.email);
    if (emailExists) {
      throw new UserEmailAlreadyExistsError(data.email);
    }

    const newUser = User.create(data);

    const user = await this.userRepository.save(newUser);

    // Invalidate cache
    await this.cacheService.del(UserCacheKeys.emailExists(data.email));
    await this.cacheService.delPattern(UserCacheKeys.listPattern);

    return user;
  }

  /**
   * Update user by ID
   */
  async update(id: string, data: UpdateUserParams): Promise<User> {
    const user = await this.userQueryRepository.updateById(id, data);

    // Invalidate cache
    await this.cacheService.del(UserCacheKeys.byId(id));
    await this.cacheService.del(UserCacheKeys.byEmail(user.email));
    await this.cacheService.delPattern(UserCacheKeys.listPattern);

    return user;
  }

  /**
   * Update user password
   */
  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    await this.userQueryRepository.updatePassword(id, hashedPassword);

    // Invalidate cache
    await this.cacheService.del(UserCacheKeys.byId(id));
    await this.cacheService.delPattern(UserCacheKeys.userPattern(id));
  }

  /**
   * Remove user (soft or hard delete)
   */
  async remove(id: string, options?: RemoveOptions): Promise<void> {
    await this.userQueryRepository.remove(id, options);

    // Invalidate cache
    await this.cacheService.del(UserCacheKeys.byId(id));
    await this.cacheService.delPattern(UserCacheKeys.listPattern);
  }

  /**
   * Confirm user email
   */
  async confirmEmail(id: string) {
    const result = await this.userQueryRepository.confirmEmail(id);

    // Invalidate cache
    await this.cacheService.del(UserCacheKeys.byId(id));
    await this.cacheService.del(UserCacheKeys.byEmail(result.email));

    return result;
  }

  /**
   * Revoke all refresh tokens for a user
   */
  async revokeAllRefreshTokens(id: string): Promise<void> {
    await this.userQueryRepository.revokeAllRefreshTokens(id);

    // Invalidate cache
    await this.cacheService.del(UserCacheKeys.refreshTokens(id));
  }

  /**
   * Upsert OAuth user
   */
  async upsertOAuthUser(data: OAuthUserData): Promise<User> {
    const user = await this.userQueryRepository.upsertOAuthUser(data);

    // Invalidate cache
    await this.cacheService.del(UserCacheKeys.byEmail(data.email));
    await this.cacheService.delPattern(UserCacheKeys.listPattern);

    return user;
  }
}
