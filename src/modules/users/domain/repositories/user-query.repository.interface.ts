import { User } from "../entities/user.entity";
import { UpdateUserParams } from "../types/update-user-params.type";
import { UserProvider, UserRole, UserStatus } from "../types/user.type";

/**
 * User Query Repository Interface
 * 
 * Specialized read-only repository for optimized query operations.
 * Returns lightweight DTOs instead of full domain entities.
 * 
 * @responsibility
 * - Optimized read queries with selective field loading
 * - Authentication and authorization data retrieval
 * - Display projections for UI components
 * - Batch loading for performance optimization
 * 
 * @principles
 * - Read-only: No mutations allowed
 * - Returns DTOs: Never returns domain entities
 * - Performance-focused: Select only required fields
 * - Auth-optimized: Tailored for authentication flows
 * 
 * @separation
 * Separated from IUserRepository to:
 * - Prevent domain entity leakage into auth layer
 * - Enable field-level query optimization
 * - Provide clear contracts for different use cases
 * - Support CQRS patterns if needed in future
 */
export interface IUserQueryRepository {




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
  findMany(criteria: UserSearchCriteria): Promise<PagedResult<User>>;

  // =====================================================
  // Authentication Queries
  // =====================================================

  /**
   * Retrieves user authentication data by ID
   * 
   * @param id - User identifier
   * @returns Lightweight auth DTO or null
   * @performance Selects only auth-necessary fields
   * @useCase JWT token validation, session verification
   */
  getAuthDataById(id: string): Promise<UserAuthDto | null>;

  /**
   * Retrieves user authentication data by email with password
   * 
   * @param email - User email address
   * @returns Auth DTO with password hash or null
   * @performance Selects only login-necessary fields
   * @useCase Credential verification during login
   * @security Password hash included for verification
   */
  getAuthDataByEmail(email: string): Promise<UserAuthWithPasswordDto | null>;

  /**
   * Checks email existence without loading user data
   * 
   * @param email - Email address to verify
   * @returns True if email is registered
   * @performance Optimized existence check (no SELECT *)
   * @useCase Registration validation, forgot password
   */
  checkEmailExists(email: string): Promise<boolean>;

  // =====================================================
  // Display Projections
  // =====================================================

  /**
   * Retrieves user profile for display purposes
   * 
   * @param id - User identifier
   * @returns Complete profile DTO or null
   * @useCase Profile pages, account settings, user detail views
   */
  getProfile(id: string): Promise<UserProfileDto | null>;

  /**
   * Retrieves minimal user data for list displays
   * 
   * @param id - User identifier
   * @returns Minimal list item DTO or null
   * @performance Minimal field selection for list rendering
   * @useCase User tables, search results, admin lists
   */
  getListItem(id: string): Promise<UserListItemDto | null>;

  /**
   * Retrieves only avatar URL
   * 
   * @param id - User identifier
   * @returns Avatar URL or null
   * @performance Single field query
   * @useCase Headers, sidebars, comment avatars, quick displays
   */
  getAvatarUrl(id: string): Promise<string | null>;

  /**
   * Retrieves display name (firstName + lastName)
   * 
   * @param id - User identifier
   * @returns Formatted display name or null
   * @performance Minimal field selection
   * @useCase Notifications, mentions, activity feeds
   */
  getDisplayName(id: string): Promise<string | null>;

  // =====================================================
  // Batch Operations
  // =====================================================

  /**
   * Batch retrieves users by multiple IDs
   * 
   * @param ids - Array of user identifiers
   * @returns Array of list item DTOs (maintains order)
   * @performance Single database query for multiple IDs
   * @useCase DataLoader pattern, relationship resolution
   * @note Missing IDs are silently skipped (no nulls in result)
   */
  getBatchByIds(ids: string[]): Promise<UserListItemDto[]>;

  /**
   * Batch retrieves auth data for multiple users
   * 
   * @param ids - Array of user identifiers
   * @returns Map of userId to auth DTO
   * @performance Single query, O(1) lookup
   * @useCase Bulk permission checks, batch authorization
   */
  getBatchAuthData(ids: string[]): Promise<Map<string, UserAuthDto>>;

  // =====================================================
  // Existence Checks
  // =====================================================

  /**
   * Checks if user exists by ID
   * 
   * @param id - User identifier
   * @returns True if user exists
   * @performance Optimized existence check
   */
  exists(id: string): Promise<boolean>;

  /**
   * Checks if any users match given IDs
   * 
   * @param ids - Array of user identifiers
   * @returns Map of id to existence boolean
   * @performance Single query for multiple checks
   */
  existsBatch(ids: string[]): Promise<Map<string, boolean>>;

  // =====================================================
  // Search and Filter
  // =====================================================

  /**
   * Searches users by term across name and email
   * 
   * @param term - Search term
   * @param options - Pagination and filter options
   * @returns Array of matching list items
   * @performance Full-text search on indexed fields
   * @useCase Autocomplete, user search, mention lookup
   */
  search(term: string, options?: SearchOptions): Promise<UserListItemDto[]>;

  /**
   * Retrieves users by role
   * 
   * @param role - User role to filter by
   * @param options - Pagination options
   * @returns Paginated list of users with role
   * @useCase Admin user management, role-based displays
   */
  getByRole(role: UserRole, options?: PaginationOptions): Promise<UserListItemDto[]>;

  /**
     * Updates existing user entity
     * 
     * @param id - User identifier
     * @param data - Partial update data
     * @param options - Transaction and metadata options
     * @returns Updated domain entity
     * @throws UserNotFoundError if user does not exist
     */
  updateById(id: string, data: UpdateUserParams): Promise<User>;

  /**
   * Updates user password securely
   * 
   * @param id - User identifier
   * @param hashedPassword - Pre-hashed password (hashing is service responsibility)
   * @param options - Transaction options
   * @throws UserNotFoundError if user does not exist
   */
  updatePassword(id: string, hashedPassword: string): Promise<void>;

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
  confirmEmail(id: string): Promise<EmailVerificationResult>;

  /**
   * Revokes all active refresh tokens for security purposes
   * 
   * @param id - User identifier
   * @param options - Transaction options
   * @throws UserNotFoundError if user does not exist
   * @useCase Logout from all devices, security breach response
   */
  revokeAllRefreshTokens(id: string): Promise<void>;

  /**
   * Creates or updates OAuth-linked user
   * 
   * @param data - OAuth provider data
   * @param options - Transaction options
   * @returns Persisted domain entity
   * @behavior Creates new user if not exists, updates provider link if exists
   */
  upsertOAuthUser(data: OAuthUserData): Promise<User>;

  /**
   * Counts total users matching criteria
   * 
   * @param criteria - Optional filter criteria
   * @returns Total count
   */
  count(criteria?: Partial<UserSearchCriteria>): Promise<number>;
}

// =====================================================
// Data Transfer Objects (DTOs)
// =====================================================

/**
 * User Authentication DTO
 * 
 * Minimal data required for authentication and authorization.
 * 
 * @readonly All fields are immutable
 * @useCase JWT payload, session data, auth guards
 */
export interface UserAuthDto {
  /** User unique identifier */
  readonly id: string;

  /** User email address */
  readonly email: string;

  /** User role for authorization */
  readonly role: UserRole;

  /** Account status (active, inactive, suspended) */
  readonly status: UserStatus;

  /** Email verification status */
  readonly emailVerified: boolean;
}

/**
 * User Authentication DTO with Password
 * 
 * Extends auth DTO with password hash for credential verification.
 * 
 * @readonly All fields are immutable
 * @useCase Login credential verification
 * @security Password is hashed, never plain text
 */
export interface UserAuthWithPasswordDto extends UserAuthDto {
  /** Hashed password for verification */
  readonly password: string | null;
}

/**
 * User Profile DTO
 * 
 * Complete user profile data for display purposes.
 * 
 * @readonly All fields are immutable
 * @useCase Profile pages, account settings, user detail views
 */
export interface UserProfileDto {
  /** User unique identifier */
  readonly id: string;

  /** User email address */
  readonly email: string;

  /** User first name */
  readonly firstName: string | null;

  /** User last name */
  readonly lastName: string | null;

  /** Profile avatar URL */
  readonly avatarUrl: string | null;

  /** Contact phone number */
  readonly phoneNumber: string | null;

  /** User role */
  readonly role: UserRole;

  /** Account status */
  readonly status: UserStatus;

  /** Account creation timestamp */
  readonly createdAt: Date;

  /** Last login timestamp */
  readonly lastLoginAt: Date | null;
}

/**
 * User List Item DTO
 * 
 * Minimal user data for list and table displays.
 * 
 * @readonly All fields are immutable
 * @useCase User tables, search results, admin lists, dropdowns
 */
export interface UserListItemDto {
  /** User unique identifier */
  readonly id: string;

  /** User email address */
  readonly email: string;

  /** User first name */
  readonly firstName: string | null;

  /** User last name */
  readonly lastName: string | null;

  /** Profile avatar URL */
  readonly avatarUrl: string | null;

  /** User role */
  readonly role: UserRole;

  /** Account status */
  readonly status: UserStatus;

  /** Account creation timestamp */
  readonly createdAt: Date;
}

// =====================================================
// Query Options
// =====================================================

/**
 * Search query options
 */
export interface SearchOptions extends PaginationOptions {
  /** Minimum search term length (default: 2) */
  minLength?: number;

  /** Maximum results to return (default: 50) */
  maxResults?: number;

  /** Include inactive users in results */
  includeInactive?: boolean;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  /** Page number (0-indexed) */
  page?: number;

  /** Items per page (default: 20) */
  limit?: number;

  /** Sort field */
  sortBy?: 'createdAt' | 'email' | 'firstName' | 'lastName';

  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
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

export type UserCountOnSearchCriteria = Partial<Omit<UserSearchCriteria, 'page' | 'pageSize' | 'sortBy' | 'sortOrder'>>;

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
// export interface RepositoryOptions {
//   /** Actor performing the operation (for audit) */
//   actorId?: string;

//   /** Skip cache for this operation */
//   skipCache?: boolean;

//   /** Request correlation ID for tracing */
//   correlationId?: string;
// }

/**
 * Deletion operation options
 */
export interface RemoveOptions {
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