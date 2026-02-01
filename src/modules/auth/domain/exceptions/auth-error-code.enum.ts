/**
 * Auth Error Codes - Authentication & Authorization related errors
 */
export const AuthErrorCode = {
  // 🔑 Credentials & Authentication
  InvalidCredentials: 'AUTH_INVALID_CREDENTIALS',
  Unauthorized: 'AUTH_UNAUTHORIZED',

  // 🎫 Token & Session
  TokenInvalid: 'AUTH_TOKEN_INVALID',
  TokenExpired: 'AUTH_TOKEN_EXPIRED',
  SessionExpired: 'AUTH_SESSION_EXPIRED',
  RefreshTokenInvalid: 'AUTH_REFRESH_TOKEN_INVALID',
  RefreshTokenExpired: 'AUTH_REFRESH_TOKEN_EXPIRED',

  // 🔐 Password
  PasswordInvalid: 'AUTH_PASSWORD_INVALID',
  PasswordMismatch: 'AUTH_PASSWORD_MISMATCH',
  PasswordExpired: 'AUTH_PASSWORD_EXPIRED',
  PasswordTooWeak: 'AUTH_PASSWORD_TOO_WEAK',
  PasswordReused: 'AUTH_PASSWORD_REUSED',
  PasswordMissing: 'AUTH_PASSWORD_MISSING',

  // ✉️ Email Verification
  EmailNotVerified: 'AUTH_EMAIL_NOT_VERIFIED',
  EmailAlreadyVerified: 'AUTH_EMAIL_ALREADY_VERIFIED',
  EmailVerificationStateMismatch: 'AUTH_EMAIL_VERIFICATION_STATE_MISMATCH',
  EmailVerificationTokenInvalid: 'AUTH_EMAIL_VERIFICATION_TOKEN_INVALID',
  EmailVerificationTokenExpired: 'AUTH_EMAIL_VERIFICATION_TOKEN_EXPIRED',
  EmailFormatInvalid: 'AUTH_EMAIL_FORMAT_INVALID',

  // 🔗 OAuth & Provider
  OAuthAlreadyLinked: 'AUTH_OAUTH_ALREADY_LINKED',
  OAuthLinkFailed: 'AUTH_OAUTH_LINK_FAILED',
  ProviderNotLinked: 'AUTH_PROVIDER_NOT_LINKED',
  InvalidProvider: 'AUTH_INVALID_PROVIDER',

  // 🚫 Account Status (Auth context)
  AccountLocked: 'AUTH_ACCOUNT_LOCKED',
  AccountNotActive: 'AUTH_ACCOUNT_NOT_ACTIVE',
  TooManyLoginAttempts: 'AUTH_TOO_MANY_LOGIN_ATTEMPTS',
  UnverifiedEmailActivation: 'AUTH_UNVERIFIED_EMAIL_ACTIVATION',
  SuspendedAccountActivation: 'AUTH_SUSPENDED_ACCOUNT_ACTIVATION',
  InactiveAccountToken: 'AUTH_INACTIVE_ACCOUNT_TOKEN',

  // 🎭 Role & Status Validation
  InvalidRole: 'AUTH_INVALID_ROLE',
  InvalidStatus: 'AUTH_INVALID_STATUS',
} as const;

export type AuthErrorCode = (typeof AuthErrorCode)[keyof typeof AuthErrorCode];
