export const DiscountType = {
  PERCENTAGE: 'PERCENTAGE',
  FIXED_AMOUNT: 'FIXED_AMOUNT',
} as const;

export type DiscountType = (typeof DiscountType)[keyof typeof DiscountType];
