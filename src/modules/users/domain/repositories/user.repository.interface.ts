import { UserEntity } from '../entities/user.entity';
import { CreateUserParams } from '../types/create-user-params.type';
import { UpdateUserParams } from '../types/update-user-params.type';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import { UserProvider, UserRole, UserStatus } from '../types/user.type';

/**
 * User Repository Interface
 * 
 * Primary repository for user aggregate root operations.
 * Handles both queries and commands for the User domain entity.
 * 
 * @responsibility
 * - User lifecycle management (create, update, delete)
 * - Domain entity retrieval with full business logic
 * - Transaction coordination
 * - Cache management (implementation detail)
 * 
 * @principles
 * - Always returns domain entities (UserEntity) for business operations
 * - Throws domain exceptions, never returns error codes
 * - Supports transactional operations
 * - Repository pattern, not DAO pattern
 */
export interface IUserRepository {

  // =====================================================
  // Query Methods (Retrieval)
  // =====================================================

  /**
   * Retrieves a user by unique identifier
   * 
   * @param id - User unique identifier
   * @returns Domain entity if found, null otherwise
   * @example
   * const user = await repo.findById('uuid-123');
   * if (!user) throw new UserNotFoundError();
   */
  findById(id: string): Promise<UserEntity | null>;

  /**
   * Retrieves a user by unique email address
   * 
   * @param email - User email address
   * @returns Domain entity if found, null otherwise
   * @example
   * const user = await repo.findByEmail('user@example.com');
   */
  findByEmail(email: string): Promise<UserEntity | null>;

  /**
   * Retrieves multiple users matching criteria with pagination
   * 
   * @param criteria - Search, filter, and pagination options
   * @returns Paginated collection of domain entities
   * @example
   * const result = await repo.findMany({ 
   *   role: 'ADMIN', 
   *   page: 1, 
   *   limit: 20 
   * });
   */
  findMany(criteria: UserSearchCriteria): Promise<PagedResult<UserEntity>>;

  /**
   * Checks existence of user by email without loading full entity
   * 
   * @param email - Email address to check
   * @returns True if exists, false otherwise
   * @performance Optimized query, does not load full entity
   */
  existsByEmail(email: string): Promise<boolean>;

  /**
   * Counts total users matching criteria
   * 
   * @param criteria - Optional filter criteria
   * @returns Total count
   */
  count(criteria?: Partial<UserSearchCriteria>): Promise<number>;

  // =====================================================
  // Command Methods (Mutations)
  // =====================================================

  /**
   * Persists a new user entity
   * 
   * @param data - User creation data
   * @param options - Transaction and metadata options
   * @returns Persisted domain entity
   * @throws UserEmailAlreadyExistsError if email already registered
   */
  save(data: CreateUserParams, options?: RepositoryOptions): Promise<UserEntity>;

  /**
   * Updates existing user entity
   * 
   * @param id - User identifier
   * @param data - Partial update data
   * @param options - Transaction and metadata options
   * @returns Updated domain entity
   * @throws UserNotFoundError if user does not exist
   */
  updateById(id: string, data: UpdateUserParams, options?: RepositoryOptions): Promise<UserEntity>;

  /**
   * Updates user password securely
   * 
   * @param id - User identifier
   * @param hashedPassword - Pre-hashed password (hashing is service responsibility)
   * @param options - Transaction options
   * @throws UserNotFoundError if user does not exist
   */
  updatePassword(id: string, hashedPassword: string, options?: RepositoryOptions): Promise<void>;

  /**
   * Removes a user (soft or hard delete based on configuration)
   * 
   * @param id - User identifier
   * @param options - Deletion options
   * @throws UserNotFoundError if user does not exist
   */
  remove(id: string, options?: RemoveOptions): Promise<void>;

  // =====================================================
  // Specialized Operations
  // =====================================================

  /**
   * Confirms user email verification status
   * 
   * @param id - User identifier
   * @param options - Transaction options
   * @returns Updated verification status
   * @throws UserNotFoundError if user does not exist
   * @sideEffect Activates user account
   */
  confirmEmail(id: string, options?: RepositoryOptions): Promise<EmailVerificationResult>;

  /**
   * Revokes all active refresh tokens for security purposes
   * 
   * @param id - User identifier
   * @param options - Transaction options
   * @throws UserNotFoundError if user does not exist
   * @useCase Logout from all devices, security breach response
   */
  revokeAllRefreshTokens(id: string, options?: RepositoryOptions): Promise<void>;

  /**
   * Creates or updates OAuth-linked user
   * 
   * @param data - OAuth provider data
   * @param options - Transaction options
   * @returns Persisted domain entity
   * @behavior Creates new user if not exists, updates provider link if exists
   */
  upsertOAuthUser(data: OAuthUserData, options?: RepositoryOptions): Promise<UserEntity>;
}

// =====================================================
// Supporting Types
// =====================================================

/**
 * Search and filter criteria for user queries
 */
export interface UserSearchCriteria {
  /** Filter by user role */
  role?: UserRole;

  /** Filter by account status */
  status?: UserStatus;

  /** Text search across name and email fields */
  searchTerm?: string;

  /** Page number (1-indexed) */
  page?: number;

  /** Items per page */
  pageSize?: number;

  /** Sort field */
  sortBy?: 'createdAt' | 'email' | 'firstName' | 'lastName' | 'lastLoginAt';

  /** Sort direction */
  sortOrder?: 'asc' | 'desc';

  /** Filter by email verification status */
  emailVerified?: boolean;

  /** Filter by OAuth provider */
  provider?: UserProvider;

  /** Filter users created after date */
  createdAfter?: Date;

  /** Filter users created before date */
  createdBefore?: Date;
}

/**
 * Generic paginated result container
 */
export interface PagedResult<T> {
  /** Result items for current page */
  items: T[];

  /** Pagination metadata */
  pagination: {
    /** Current page number */
    currentPage: number;

    /** Items per page */
    pageSize: number;

    /** Total items across all pages */
    totalItems: number;

    /** Total pages available */
    totalPages: number;

    /** Has next page */
    hasNext: boolean;

    /** Has previous page */
    hasPrevious: boolean;
  };
}

/**
 * Repository operation options
 */
export interface RepositoryOptions {
  /** Transaction client for atomic operations */
  transaction?: TransactionClient;

  /** Actor performing the operation (for audit) */
  actorId?: string;

  /** Skip cache for this operation */
  skipCache?: boolean;

  /** Request correlation ID for tracing */
  correlationId?: string;
}

/**
 * Deletion operation options
 */
export interface RemoveOptions extends RepositoryOptions {
  /** Perform hard delete instead of soft delete */
  hard?: boolean;

  /** Reason for deletion (for audit) */
  reason?: string;
}

/**
 * Email verification confirmation result
 */
export interface EmailVerificationResult {
  /** User identifier */
  userId: string;

  /** User email */
  email: string;

  /** Verification timestamp */
  verifiedAt: Date;

  /** Updated account status */
  status: string;
}

/**
 * OAuth user data for upsert operations
 */
export interface OAuthUserData {
  /** OAuth provider (google, facebook, etc.) */
  provider: string;

  /** Provider-specific user ID */
  providerId: string;

  /** User email from provider */
  email: string;

  /** User display name from provider */
  displayName: string;

  /** User avatar URL from provider */
  avatarUrl?: string;

  /** Email verification status from provider */
  emailVerified?: boolean;
}