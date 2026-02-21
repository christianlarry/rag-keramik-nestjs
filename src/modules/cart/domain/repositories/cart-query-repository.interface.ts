// ===== Query Results =====
export interface CartItemResult {
  id: string;
  productId: string;
  productName?: string;
  productSku?: string;
  productImageUrl?: string;
  unitPrice?: number;
  quantity: number;
  subtotal?: number;
  currency?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartDetailResult {
  id: string;
  userId: string;
  items: CartItemResult[];
  itemCount: number;
  totalQuantity: number;
  estimatedTotal?: number;
  currency?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ===== Repository Interface =====
export const CART_QUERY_REPOSITORY_TOKEN = 'CART_QUERY_REPOSITORY';

/**
 * CartQueryRepository
 *
 * Repository khusus untuk query/read operations yang tidak memerlukan domain entity rehydration.
 * Returns enriched DTOs with product information for display purposes.
 *
 * Pattern: CQRS (Command Query Responsibility Segregation)
 */
export interface CartQueryRepository {
  /**
   * Get cart detail for display (enriched with product info)
   */
  getCartByUserId(userId: string): Promise<CartDetailResult | null>;

  /**
   * Get cart detail by cart ID
   */
  getCartById(cartId: string): Promise<CartDetailResult | null>;
}
