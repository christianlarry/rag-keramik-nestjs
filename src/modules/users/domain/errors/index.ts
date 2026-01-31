// Export all user domain errors
export * from './user/user-not-found.error';
export * from './user/user-username-already-exists.error';
export * from './user/user-inactive.error';
export * from './user/user-suspended.error';
export * from './user/user-deleted.error';
export * from './user/user-banned.error';
export * from './user/user-unauthorized.error';
export * from './user/user-forbidden.error';
export * from './user/user-insufficient-permissions.error';
export * from './user/user-invalid-credentials.error';
export * from './user/user-token-invalid.error';
export * from './user/user-token-expired.error';
export * from './user/user-session-expired.error';
export * from './user/user-cannot-be-updated.error';
export * from './user/user-cannot-be-deleted.error';
export * from './user/user-cannot-self-delete.error';
export * from './user/user-cannot-change-own-role.error';
export * from './user/user-profile-incomplete.error';
export * from './user/user-avatar-upload-failed.error';
export * from './user/user-oauth-link-failed.error';
export * from './user/user-oauth-already-linked.error';
export * from './user/user-provider-not-linked.error';

// Export all password domain errors
export * from './password/password-invalid.error';
export * from './password/password-mismatch.error';
export * from './password/password-expired.error';
export * from './password/password-too-weak.error';

// Export all email domain errors
export * from './email/email-format-invalid.error';
export * from './email/email-not-verified.error';
export * from './email/email-already-verified.error';
export * from './email/email-already-exists.error';
export * from './email/email-verification-state-mismatch.error';

// Export enums
export * from './enums/user-error-code.enum';
export * from './enums/email-error-code.enum';
export * from './enums/password-error-code.enum';
