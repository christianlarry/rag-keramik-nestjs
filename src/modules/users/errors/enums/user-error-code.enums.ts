export const UserErrorCode = {
  USER_NOT_FOUND: "USER_NOT_FOUND",
} as const;

export type UserErrorCode = typeof UserErrorCode[keyof typeof UserErrorCode];