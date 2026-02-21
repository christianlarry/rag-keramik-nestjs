import { Cart } from '../entities/cart.entity';
import { CartId } from '../value-objects/cart-id.vo';

/**
 * CartRepository
 *
 * Repository untuk domain operations yang memerlukan full entity rehydration.
 * Digunakan untuk operasi write (create, update, delete) dan read yang memerlukan business logic.
 *
 * Pattern: Domain-Driven Design Repository
 * - Semua method return/accept domain entities
 * - Digunakan untuk command operations (write)
 */
export interface CartRepository {
  /**
   * Find cart by ID
   */
  findById(cartId: CartId): Promise<Cart | null>;

  /**
   * Find cart by user ID (one cart per user)
   */
  findByUserId(userId: string): Promise<Cart | null>;

  /**
   * Save a cart (create or update)
   */
  save(cart: Cart): Promise<void>;

  /**
   * Delete a cart
   */
  delete(cartId: CartId): Promise<void>;
}

export const CART_REPOSITORY_TOKEN = 'CART_REPOSITORY';
