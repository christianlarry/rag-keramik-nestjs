export const PAYMENT_QUERY_REPOSITORY = 'PAYMENT_QUERY_REPOSITORY';

// ============================================================
// Result DTOs
// ============================================================

export interface PaymentDetailResult {
  id: string;
  orderId: string;
  provider: string;
  providerRef: string;
  status: string;
  amount: number;
  currency: string;
  rawWebhookPayload: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentListResult {
  id: string;
  orderId: string;
  provider: string;
  providerRef: string;
  status: string;
  amount: number;
  currency: string;
  createdAt: Date;
}

export interface PaymentSearchParams {
  orderId?: string;
  status?: string;
  provider?: string;
  page?: number;
  limit?: number;
}

// ============================================================
// Query Repository Interface
// ============================================================

export interface PaymentQueryRepository {
  /**
   * Get detailed payment information by ID
   */
  getPaymentDetailById(id: string): Promise<PaymentDetailResult | null>;

  /**
   * Get detailed payment by provider reference
   */
  getPaymentDetailByProviderRef(
    providerRef: string,
  ): Promise<PaymentDetailResult | null>;

  /**
   * Get all payments for a specific order
   */
  getPaymentsByOrderId(orderId: string): Promise<PaymentListResult[]>;

  /**
   * Search and list payments with filters
   */
  searchPayments(params: PaymentSearchParams): Promise<PaymentListResult[]>;

  /**
   * Count payments matching filter criteria
   */
  countPayments(params: PaymentSearchParams): Promise<number>;
}
