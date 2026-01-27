import { User } from '../entities/user.entity';

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
 * - Always returns domain entities (User) for business operations
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
  findById(id: string): Promise<User | null>;

  /**
   * Retrieves a user by unique email address
   * 
   * @param email - User email address
   * @returns Domain entity if found, null otherwise
   * @example
   * const user = await repo.findByEmail('user@example.com');
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Checks existence of user by email without loading full entity
   * 
   * @param email - Email address to check
   * @returns True if exists, false otherwise
   * @performance Optimized query, does not load full entity
   */
  existsByEmail(email: string): Promise<boolean>;


  /**
   * Persists a new user entity
   * 
   * @param data - User creation data
   * @param options - Transaction and metadata options
   * @returns Persisted domain entity
   * @throws UserEmailAlreadyExistsError if email already registered
   */
  save(data: User): Promise<User>;
}