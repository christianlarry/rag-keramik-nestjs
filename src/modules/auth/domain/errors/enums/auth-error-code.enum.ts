export const AuthErrorCode = {
  INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  PASSWORD_TOO_WEAK: 'AUTH_PASSWORD_TOO_WEAK',
  INVALID_PROVIDER: 'AUTH_INVALID_PROVIDER',
} as const;

export type AuthErrorCode = typeof AuthErrorCode[keyof typeof AuthErrorCode];