export const AuditTargetType = {
  USER: 'user',
  PRODUCT: 'product',
  ORDER: 'order',
  DOCUMENT: 'document',
} as const;

export type AuditTargetType = typeof AuditTargetType[keyof typeof AuditTargetType];