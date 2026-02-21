import { Payment } from '../entities/payment.entity';

export const PAYMENT_REPOSITORY = 'PAYMENT_REPOSITORY';

export interface PaymentRepository {
  /**
   * Find a payment by its ID
   */
  findById(id: string): Promise<Payment | null>;

  /**
   * Find a payment by provider reference (e.g., Midtrans order_id)
   */
  findByProviderRef(providerRef: string): Promise<Payment | null>;

  /**
   * Find all payments for a specific order
   */
  findByOrderId(orderId: string): Promise<Payment[]>;

  /**
   * Check if a provider reference already exists
   */
  existsByProviderRef(providerRef: string): Promise<boolean>;

  /**
   * Save a payment (create or update)
   */
  save(payment: Payment): Promise<void>;

  /**
   * Delete a payment
   */
  delete(id: string): Promise<void>;
}
