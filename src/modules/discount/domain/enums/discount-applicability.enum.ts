export const DiscountApplicability = {
  ALL_PRODUCTS: 'ALL_PRODUCTS',
  SPECIFIC_PRODUCTS: 'SPECIFIC_PRODUCTS',
  MINIMUM_PURCHASE: 'MINIMUM_PURCHASE',
} as const;

export type DiscountApplicability =
  (typeof DiscountApplicability)[keyof typeof DiscountApplicability];
