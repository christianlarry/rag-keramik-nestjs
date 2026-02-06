export const AuthErrorCode = {
  INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  PASSWORD_TOO_WEAK: 'AUTH_PASSWORD_TOO_WEAK',
  INVALID_PROVIDER: 'AUTH_INVALID_PROVIDER',
  INVALID_AUTH_STATE: 'AUTH_INVALID_AUTH_STATE'
} as const;

export type AuthErrorCode = typeof AuthErrorCode[keyof typeof AuthErrorCode];