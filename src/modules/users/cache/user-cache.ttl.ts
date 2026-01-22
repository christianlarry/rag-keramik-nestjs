/**
 * Configuration constants for user cache TTL (Time To Live)
 * All values are in seconds
 */
export const UserCacheTTL = {
  USER_DETAIL: 300,
  USER_LIST: 120,
  EMAIL_EXISTS: 600,
  USER_STATS: 300,
} as const;
