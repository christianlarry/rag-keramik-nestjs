export const UserErrorCode = {
  INVALID_USER_ID: 'USER_INVALID_ID',
  INVALID_EMAIL: 'USER_INVALID_EMAIL',
  INVALID_ROLE: 'USER_INVALID_ROLE',
  PASSWORD_TOO_WEAK: 'USER_PASSWORD_TOO_WEAK',
}

export type UserErrorCode = typeof UserErrorCode[keyof typeof UserErrorCode];