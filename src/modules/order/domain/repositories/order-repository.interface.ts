import { Order } from '../entities/order.entity';
import { OrderId } from '../value-objects/order-id.vo';
import { OrderNumber } from '../value-objects/order-number.vo';

/**
 * OrderRepository
 *
 * Repository untuk domain operations yang memerlukan full entity rehydration.
 * Digunakan untuk operasi write (create, update, delete) dan read yang memerlukan business logic.
 *
 * Pattern: Domain-Driven Design Repository
 */
export interface OrderRepository {
  /**
   * Find order by ID
   */
  findById(orderId: OrderId): Promise<Order | null>;

  /**
   * Find order by order number
   */
  findByOrderNumber(orderNumber: OrderNumber): Promise<Order | null>;

  /**
   * Check if order number exists
   */
  existsByOrderNumber(orderNumber: OrderNumber): Promise<boolean>;

  /**
   * Save order (create or update)
   */
  save(order: Order): Promise<void>;

  /**
   * Delete order (soft delete in most implementations)
   */
  delete(orderId: OrderId): Promise<void>;
}

export const ORDER_REPOSITORY_TOKEN = 'ORDER_REPOSITORY';
