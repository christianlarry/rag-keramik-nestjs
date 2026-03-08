export const ProductApplicationErrorEnum = {
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
  PRODUCT_ALREADY_EXISTS: 'PRODUCT_ALREADY_EXISTS',
  SKU_ALREADY_EXISTS: 'PRODUCT_SKU_ALREADY_EXISTS',
} as const;

export type ProductApplicationErrorEnum = typeof ProductApplicationErrorEnum[keyof typeof ProductApplicationErrorEnum];