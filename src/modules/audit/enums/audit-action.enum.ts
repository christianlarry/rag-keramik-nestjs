export const AuditAction = {
  REGISTER: 'register',
  LOGIN: 'login',
  OAUTH_LOGIN: 'oauth_login',
  LOGOUT: 'logout',
  PASSWORD_CHANGE: 'password_change',
  PASSWORD_RESET: 'password_reset',
  EMAIL_VERIFICATION: 'email_verification',
  PROFILE_UPDATE: 'profile_update',
  ADDRESS_ADD: 'address_add',
  ADDRESS_UPDATE: 'address_update',
  ADDRESS_DELETE: 'address_delete',
  ORDER_CREATE: 'order_create',
  ORDER_UPDATE: 'order_update',
  ORDER_CANCEL: 'order_cancel',
  PAYMENT_WEBHOOK: 'payment_webhook',
  DOCUMENT_UPLOAD: 'document_upload',
  DOCUMENT_DELETE: 'document_delete',
  CHAT_SESSION_START: 'chat_session_start',
  CHAT_SESSION_END: 'chat_session_end',
} as const;

export type AuditAction = typeof AuditAction[keyof typeof AuditAction];