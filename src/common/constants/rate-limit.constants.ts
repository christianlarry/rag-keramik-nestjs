/**
 * TTL (Time To Live) constants in milliseconds
 * Time window for rate limiting
 */
export const TTL = {
  ONE_MINUTE: 60_000,         // 60 seconds
  FIVE_MINUTES: 300_000,      // 5 minutes
  FIFTEEN_MINUTES: 900_000,   // 15 minutes
  THIRTY_MINUTES: 1_800_000,  // 30 minutes
  ONE_HOUR: 3_600_000,        // 1 hour
  ONE_DAY: 86_400_000,        // 24 hours
} as const;

/**
 * Request limit constants
 * Maximum number of requests allowed within TTL window
 */
export const LIMIT = {
  VERY_STRICT: 3,     // For sensitive operations (email resend, forgot password)
  STRICT: 5,          // For authentication (login, register)
  MODERATE: 10,       // For token operations
  LENIENT: 20,        // For logout, less critical operations
  GENEROUS: 100,      // For general API endpoints
  UNLIMITED: 1000,    // For authenticated premium users
} as const;
