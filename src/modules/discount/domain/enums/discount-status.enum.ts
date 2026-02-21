export const DiscountStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  EXPIRED: 'EXPIRED',
} as const;

export type DiscountStatus =
  (typeof DiscountStatus)[keyof typeof DiscountStatus];
