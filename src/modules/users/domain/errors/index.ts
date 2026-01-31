// Export all user domain errors
export * from './user-not-found.error';
export * from './user-username-already-exists.error';
export * from './user-inactive.error';
export * from './user-suspended.error';
export * from './user-deleted.error';
export * from './user-banned.error';
export * from './user-unauthorized.error';
export * from './user-forbidden.error';
export * from './user-insufficient-permissions.error';
export * from './user-invalid-credentials.error';
export * from './user-password-invalid.error';
export * from './user-password-mismatch.error';
export * from './user-password-expired.error';
export * from './user-password-too-weak.error';
export * from './user-token-invalid.error';
export * from './user-token-expired.error';
export * from './user-session-expired.error';
export * from './user-cannot-be-updated.error';
export * from './user-cannot-be-deleted.error';
export * from './user-cannot-self-delete.error';
export * from './user-cannot-change-own-role.error';
export * from './user-profile-incomplete.error';
export * from './user-avatar-upload-failed.error';
export * from './user-oauth-link-failed.error';
export * from './user-oauth-already-linked.error';
export * from './user-provider-not-linked.error';

// Export all email domain errors
export * from './email-format-invalid.error';
export * from './email-not-verified.error';
export * from './email-already-verified.error';
export * from './email-already-exists.error';
export * from './email-verification-state-mismatch.error';

// Export enums
export * from './enums/user-error-code.enum';
export * from './enums/email-error-code.enum';
