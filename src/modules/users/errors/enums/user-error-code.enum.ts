export const UserErrorCode = {
  // 🔍 Not Found
  USER_NOT_FOUND: "USER_NOT_FOUND",

  // 🧍‍♂️ Existence / Uniqueness
  USER_ALREADY_EXISTS: "USER_ALREADY_EXISTS",

  // 🚫 State / Status
  USER_INACTIVE: "USER_INACTIVE",
  USER_SUSPENDED: "USER_SUSPENDED",
  USER_DELETED: "USER_DELETED",

  // Auth
  USER_UNAUTHORIZED: "USER_UNAUTHORIZED",
  USER_FORBIDDEN: "USER_FORBIDDEN",

  // 🧾 Validation (domain-level, bukan DTO)
  USER_EMAIL_INVALID: "USER_EMAIL_INVALID",
  USER_PASSWORD_INVALID: "USER_PASSWORD_INVALID",

  // 🔁 Operation constraints
  USER_CANNOT_BE_UPDATED: "USER_CANNOT_BE_UPDATED",
  USER_CANNOT_BE_DELETED: "USER_CANNOT_BE_DELETED",
} as const;

export type UserErrorCode = typeof UserErrorCode[keyof typeof UserErrorCode];