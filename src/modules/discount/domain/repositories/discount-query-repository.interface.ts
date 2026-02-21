export const DISCOUNT_QUERY_REPOSITORY = 'DISCOUNT_QUERY_REPOSITORY';

// ============================================================
// Result DTOs
// ============================================================

export interface DiscountDetailResult {
  id: string;
  code: string;
  name: string;
  description: string | null;
  type: string;
  applicability: string;
  value: number;
  minPurchase: number | null;
  maxDiscount: number | null;
  usageLimit: number | null;
  usageCount: number;
  perUserLimit: number | null;
  startDate: Date;
  endDate: Date;
  status: string;
  productIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DiscountListResult {
  id: string;
  code: string;
  name: string;
  type: string;
  applicability: string;
  value: number;
  status: string;
  startDate: Date;
  endDate: Date;
  usageCount: number;
  usageLimit: number | null;
}

export interface DiscountSearchParams {
  status?: string;
  type?: string;
  applicability?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// ============================================================
// Query Repository Interface
// ============================================================

export interface DiscountQueryRepository {
  /**
   * Get detailed discount information by ID
   */
  getDiscountDetailById(id: string): Promise<DiscountDetailResult | null>;

  /**
   * Get detailed discount information by code
   */
  getDiscountDetailByCode(
    code: string,
  ): Promise<DiscountDetailResult | null>;

  /**
   * Search and list discounts with filters
   */
  searchDiscounts(
    params: DiscountSearchParams,
  ): Promise<DiscountListResult[]>;

  /**
   * Count discounts matching filter criteria
   */
  countDiscounts(params: DiscountSearchParams): Promise<number>;

  /**
   * Get all currently active and valid discounts
   */
  getActiveDiscounts(now?: Date): Promise<DiscountListResult[]>;

  /**
   * Get expired discounts that are still marked as ACTIVE (for batch expiration)
   */
  getExpiredActiveDiscounts(now?: Date): Promise<DiscountListResult[]>;

  /**
   * Get user's usage count for a specific discount
   */
  getUserUsageCount(discountId: string, userId: string): Promise<number>;
}
