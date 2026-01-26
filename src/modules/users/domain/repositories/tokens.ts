/**
 * Dependency Injection Tokens for User Repositories
 * 
 * These symbols are used as injection tokens in NestJS DI system.
 * They allow us to inject interface implementations at runtime.
 * 
 * Usage:
 * ```typescript
 * // In module providers:
 * {
 *   provide: USER_REPOSITORY,
 *   useClass: UserRepository,
 * }
 * 
 * // In service constructor:
 * constructor(
 *   @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository
 * )
 * ```
 */

/**
 * Injection token for IUserRepository (write operations)
 */
export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

/**
 * Injection token for IUserQueryRepository (read operations)
 */
export const USER_QUERY_REPOSITORY = Symbol('USER_QUERY_REPOSITORY');