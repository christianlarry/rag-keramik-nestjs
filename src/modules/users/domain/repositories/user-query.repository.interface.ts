import { Role, UserStatus } from 'src/generated/prisma/enums';

/**
 * User Query Repository Interface - Read-Only Operations
 * 
 * This repository handles read-only queries, especially for authentication.
 * Returns DTOs or primitives, NOT domain entities.
 * 
 * Principles:
 * - Returns DTOs (read-only data snapshots)
 * - No write operations
 * - No domain entity methods (no fullName, isActive, etc.)
 * - Optimized for performance (select only needed fields)
 * - Used primarily by Auth module
 * 
 * Why separate from IUserRepository?
 * - Auth doesn't need full domain entities
 * - Prevents domain entity leakage into auth layer
 * - Performance: select only needed fields
 * - Clear separation: queries vs commands
 */
export interface IUserQueryRepository {
  // ==================== Auth-Specific Queries ====================

  /**
   * Find user by ID for authentication purposes
   * Returns lightweight DTO with only auth-necessary fields
   * 
   * @param id - User ID
   * @returns UserAuthDto or null if not found
   * @use JWT validation, refresh token validation
   */
  findByIdForAuth(id: string): Promise<UserAuthDto | null>;

  /**
   * Find user by email for authentication purposes
   * Returns DTO with password for credential verification
   * 
   * @param email - User email
   * @returns UserAuthWithPasswordDto or null if not found
   * @use Login, password verification
   */
  findByEmailForAuth(email: string): Promise<UserAuthWithPasswordDto | null>;

  /**
   * Check if email exists (lightweight check)
   * 
   * @param email - Email to check
   * @returns boolean
   * @use Registration validation, email availability check
   */
  existsByEmail(email: string): Promise<boolean>;

  // ==================== Lightweight Projection Queries ====================

  /**
   * Get user profile info (for display purposes)
   * 
   * @param id - User ID
   * @returns UserProfileDto or null if not found
   * @use Profile pages, user cards, avatars
   */
  findUserProfile(id: string): Promise<UserProfileDto | null>;

  /**
   * Get minimal user info (for lists/tables)
   * 
   * @param id - User ID
   * @returns UserListItemDto or null if not found
   * @use User lists, admin tables, search results
   */
  findUserListItem(id: string): Promise<UserListItemDto | null>;

  /**
   * Get user avatar URL only
   * 
   * @param id - User ID
   * @returns Avatar URL or null
   * @use Header, sidebar, comments
   */
  findUserAvatar(id: string): Promise<string | null>;

  /**
   * Batch fetch users by IDs (for efficient loading)
   * 
   * @param ids - Array of user IDs
   * @returns Array of UserListItemDto
   * @use DataLoader pattern, batch operations
   */
  findManyByIds(ids: string[]): Promise<UserListItemDto[]>;
}

// ==================== Read-Only DTOs ====================

/**
 * User Auth DTO - For JWT validation and auth checks
 * Used by: JWT Strategy, Refresh Strategy, Auth Guards
 */
export interface UserAuthDto {
  readonly id: string;
  readonly email: string;
  readonly role: Role;
  readonly status: UserStatus;
  readonly emailVerified: boolean;
}

/**
 * User Auth DTO with Password - For login credential verification
 * Used by: Login endpoint
 */
export interface UserAuthWithPasswordDto extends UserAuthDto {
  readonly password: string | null;
}

/**
 * User Profile DTO - For displaying user profiles
 * Used by: Profile pages, user details
 */
export interface UserProfileDto {
  readonly id: string;
  readonly email: string;
  readonly firstName: string | null;
  readonly lastName: string | null;
  readonly avatarUrl: string | null;
  readonly phoneNumber: string | null;
  readonly role: Role;
  readonly status: UserStatus;
  readonly createdAt: Date;
  readonly lastLoginAt: Date | null;
}

/**
 * User List Item DTO - For lists and tables
 * Used by: Admin user lists, search results, autocomplete
 */
export interface UserListItemDto {
  readonly id: string;
  readonly email: string;
  readonly firstName: string | null;
  readonly lastName: string | null;
  readonly avatarUrl: string | null;
  readonly role: Role;
  readonly status: UserStatus;
  readonly createdAt: Date;
}