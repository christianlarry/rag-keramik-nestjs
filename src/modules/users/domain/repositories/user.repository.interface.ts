import { UserEntity } from '../entities/user.entity';
import { CreateUserParams } from '../types/create-user-params.type';
import { UpdateUserParams } from '../types/update-user-params.type';
import { AuthProvider, Role } from 'src/generated/prisma/enums';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';

/**
 * User Repository Interface - Command Operations (Write)
 * 
 * This repository handles all write operations (create, update, delete)
 * and returns full domain entities.
 * 
 * Principles:
 * - Returns UserEntity (domain object with business logic)
 * - Handles transactions
 * - Manages cache invalidation
 * - Throws domain exceptions (UserNotFoundError, etc.)
 */
export interface IUserRepository {
  // ==================== Query Operations ====================
  // Note: These return domain entities for business logic operations

  /**
   * Find user by ID - Returns full domain entity
   * @param id - User ID
   * @returns UserEntity or null if not found
   * @throws Never throws - returns null instead
   */
  findById(id: string): Promise<UserEntity | null>;

  /**
   * Find user by email - Returns full domain entity
   * @param email - User email
   * @returns UserEntity or null if not found
   * @throws Never throws - returns null instead
   */
  findByEmail(email: string): Promise<UserEntity | null>;

  /**
   * Find all users with pagination
   * @param params - Pagination and filter parameters
   * @returns Paginated list of user entities
   */
  findAll(params: FindAllUsersParams): Promise<PaginatedResult<UserEntity>>;

  /**
   * Check if email exists in database
   * @param email - Email to check
   * @returns boolean indicating existence
   */
  existsByEmail(email: string): Promise<boolean>;

  // ==================== Command Operations ====================

  /**
   * Create a new user
   * @param data - User creation data
   * @param tx - Optional transaction client
   * @returns Created user entity
   * @throws UserEmailAlreadyExistsError if email already exists
   */
  create(data: CreateUserParams, tx?: TransactionClient): Promise<UserEntity>;

  /**
   * Update user profile
   * @param id - User ID
   * @param data - User update data
   * @returns Updated user entity
   * @throws UserNotFoundError if user not found
   */
  update(id: string, data: UpdateUserParams): Promise<UserEntity>;

  /**
   * Update user password
   * @param id - User ID
   * @param hashedPassword - New hashed password
   * @param tx - Optional transaction client
   * @throws UserNotFoundError if user not found
   */
  updatePassword(id: string, hashedPassword: string, tx?: TransactionClient): Promise<void>;

  /**
   * Upsert OAuth user (create if not exists, update if exists)
   * @param data - OAuth user data
   * @returns User entity
   */
  upsertOAuthUser(data: UpsertOAuthUserData): Promise<UserEntity>;

  /**
   * Clear all refresh tokens for a user
   * @param userId - User ID
   * @param tx - Optional transaction client
   * @returns boolean indicating success
   * @throws UserNotFoundError if user not found
   */
  clearRefreshTokens(userId: string, tx?: TransactionClient): Promise<boolean>;

  /**
   * Mark user's email as verified
   * @param userId - User ID
   * @param tx - Optional transaction client
   * @returns Updated user entity with only necessary fields
   * @throws UserNotFoundError if user not found
   */
  markEmailAsVerified(
    userId: string,
    tx?: TransactionClient
  ): Promise<Pick<UserEntity, 'id' | 'email' | 'status' | 'firstName' | 'lastName'>>;

  /**
   * Soft delete user (set deletedAt timestamp)
   * @param id - User ID
   * @throws UserNotFoundError if user not found
   */
  softDelete(id: string): Promise<void>;

  /**
   * Hard delete user (permanent removal)
   * @param id - User ID
   * @throws UserNotFoundError if user not found
   */
  hardDelete(id: string): Promise<void>;
}

// ==================== Supporting Types ====================