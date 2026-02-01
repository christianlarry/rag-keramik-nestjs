// ============================================
// Auth Domain Errors - Index
// ============================================

// Error Code Enum
export * from './auth-error-code.enum';

// Credentials Errors
export * from './credentials/invalid-credentials.error';
export * from './credentials/unauthorized.error';

// Token & Session Errors
export * from './token/token-invalid.error';
export * from './token/token-expired.error';
export * from './token/session-expired.error';
export * from './token/refresh-token-invalid.error';
export * from './token/refresh-token-expired.error';

// Password Errors
export * from './password/password-invalid.error';
export * from './password/password-mismatch.error';
export * from './password/password-expired.error';
export * from './password/password-too-weak.error';
export * from './password/password-reused.error';
export * from './password/password-missing.error';

// Email Verification Errors
export * from './email/email-not-verified.error';
export * from './email/email-already-verified.error';
export * from './email/email-verification-state-mismatch.error';
export * from './email/email-verification-token-invalid.error';
export * from './email/email-verification-token-expired.error';

// OAuth & Provider Errors
export * from './oauth/oauth-already-linked.error';
export * from './oauth/oauth-link-failed.error';
export * from './oauth/provider-not-linked.error';
export * from './oauth/invalid-provider.error';

// Account Status Errors (Auth context)
export * from './account/account-locked.error';
export * from './account/account-not-active.error';
export * from './account/too-many-login-attempts.error';
export * from './account/invalid-role.error';
export * from './account/invalid-status.error';
export * from './account/unverified-email-activation.error';
export * from './account/suspended-account-activation.error';
export * from './account/inactive-account-token.error';
