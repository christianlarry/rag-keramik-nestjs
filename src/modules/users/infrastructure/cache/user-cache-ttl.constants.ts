/**
 * Configuration constants for user cache TTL (Time To Live)
 * All values are in seconds
 */
export const UserCacheTTL = {
  /** User detail by ID or email - 5 minutes */
  USER_DETAIL: 300,

  /** User list with pagination - 2 minutes */
  USER_LIST: 120,

  /** Email existence check - 10 minutes */
  EMAIL_EXISTS: 600,

  /** User statistics - 5 minutes */
  USER_STATS: 300,

  /** Authentication data (by ID or email) - 5 minutes */
  AUTH_DATA: 300,

  /** User profile - 5 minutes */
  PROFILE: 300,

  /** User list item - 5 minutes */
  LIST_ITEM: 300,

  /** Avatar URL - 10 minutes */
  AVATAR_URL: 600,

  /** Display name - 5 minutes */
  DISPLAY_NAME: 300,

  /** Batch user data - 5 minutes */
  BATCH_DATA: 300,

  /** Batch auth data - 5 minutes */
  BATCH_AUTH_DATA: 300,

  /** User existence check - 10 minutes */
  EXISTS: 600,

  /** Batch existence check - 10 minutes */
  EXISTS_BATCH: 600,

  /** Search results - 2 minutes */
  SEARCH: 120,

  /** Users by role - 5 minutes */
  BY_ROLE: 300,

  /** User count - 5 minutes */
  COUNT: 300,

  /** Refresh tokens - 7 days */
  REFRESH_TOKENS: 604800,
} as const;
