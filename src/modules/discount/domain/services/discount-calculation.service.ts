import { Money } from 'src/core/domain/money.vo';

export const DISCOUNT_CALCULATION_SERVICE = 'DISCOUNT_CALCULATION_SERVICE';

/**
 * Discount Calculation Domain Service Interface
 *
 * Handles complex discount calculations that span multiple aggregates
 * (e.g., validating per-user limits requires checking order history).
 */
export interface DiscountCalculationService {
  /**
   * Validate and calculate discount for an order
   *
   * @param discountCode - The discount code to apply
   * @param userId - The user applying the discount
   * @param purchaseAmount - Total purchase amount before discount
   * @param productIds - Products in the order (for applicability check)
   * @returns The calculated discount amount
   */
  calculateOrderDiscount(
    discountCode: string,
    userId: string,
    purchaseAmount: Money,
    productIds: string[],
  ): Promise<Money>;

  /**
   * Validate that a discount can be applied by a specific user
   * Checks per-user usage limits and other user-specific constraints.
   *
   * @param discountCode - The discount code to validate
   * @param userId - The user attempting to use the discount
   * @returns true if the user can use this discount
   */
  canUserApplyDiscount(
    discountCode: string,
    userId: string,
  ): Promise<boolean>;
}
