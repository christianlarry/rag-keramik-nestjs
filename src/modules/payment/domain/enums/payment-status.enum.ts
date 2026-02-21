export const PaymentStatusEnum = {
  INITIATED: 'INITIATED',
  PENDING: 'PENDING',
  SETTLEMENT: 'SETTLEMENT',
  CANCEL: 'CANCEL',
  EXPIRE: 'EXPIRE',
  DENY: 'DENY',
  REFUND: 'REFUND',
  FAILED: 'FAILED',
} as const;

export type PaymentStatusEnum =
  (typeof PaymentStatusEnum)[keyof typeof PaymentStatusEnum];
