import { Discount } from '../entities/discount.entity';

export const DISCOUNT_REPOSITORY = 'DISCOUNT_REPOSITORY';

export interface DiscountRepository {
  /**
   * Find a discount by its ID
   */
  findById(id: string): Promise<Discount | null>;

  /**
   * Find a discount by its code
   */
  findByCode(code: string): Promise<Discount | null>;

  /**
   * Check if a discount with the given code already exists
   */
  existsByCode(code: string): Promise<boolean>;

  /**
   * Save a discount (create or update)
   */
  save(discount: Discount): Promise<void>;

  /**
   * Delete a discount
   */
  delete(id: string): Promise<void>;
}
