export const ProductStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  DISCONTINUED: 'DISCONTINUED',
  OUT_OF_STOCK: 'OUT_OF_STOCK',
} as const;

export type ProductStatus = (typeof ProductStatus)[keyof typeof ProductStatus];
