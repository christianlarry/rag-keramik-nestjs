export const UserErrorCode = {
  INVALID_USER_ID: 'USER_INVALID_ID',
  INVALID_EMAIL: 'USER_INVALID_EMAIL',
  INVALID_ROLE: 'USER_INVALID_ROLE',
  INVALID_STATUS: 'USER_INVALID_STATUS',
}

export type UserErrorCode = typeof UserErrorCode[keyof typeof UserErrorCode];