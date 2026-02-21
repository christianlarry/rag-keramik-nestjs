import { OrderStatusType } from '../enums';

// ===== Query Options =====
export interface FindAllOrdersQueryOptions {
  page?: number;
  limit?: number;
  userId?: string;
  status?: OrderStatusType;
  startDate?: Date;
  endDate?: Date;
}

export interface OrderSearchCriteria {
  userId?: string;
  orderNumber?: string;
  status?: OrderStatusType;
  minTotal?: number;
  maxTotal?: number;
  startDate?: Date;
  endDate?: Date;
  skip?: number;
  take?: number;
}

// ===== Query Results =====
export interface OrderItemResult {
  id: string;
  productId: string;
  productName?: string;
  productSku?: string;
  quantity: number;
  unitPrice: number;
  originalPrice: number;
  currency: string;
  subtotal: number;
}

export interface OrderListItemResult {
  id: string;
  orderNumber: string;
  userId: string;
  status: OrderStatusType;
  subtotal: number;
  tax: number;
  shippingCost: number;
  discountAmount: number;
  total: number;
  currency: string;
  itemCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface FindAllOrdersQueryResult {
  orders: OrderListItemResult[];
  total: number;
}

export interface OrderDetailResult {
  id: string;
  orderNumber: string;
  userId: string;
  status: OrderStatusType;
  items: OrderItemResult[];
  subtotal: number;
  tax: number;
  shippingCost: number;
  discountAmount: number;
  discountId: string | null;
  total: number;
  currency: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ===== Repository Interface =====
export const ORDER_QUERY_REPOSITORY_TOKEN = 'ORDER_QUERY_REPOSITORY';

/**
 * OrderQueryRepository
 *
 * Repository khusus untuk query/read operations yang tidak memerlukan domain entity rehydration.
 *
 * Pattern: CQRS (Command Query Responsibility Segregation)
 */
export interface OrderQueryRepository {
  /**
   * Get paginated list of orders
   */
  findAllOrders(
    options?: FindAllOrdersQueryOptions,
  ): Promise<FindAllOrdersQueryResult>;

  /**
   * Get order detail by ID
   */
  getOrderDetailById(orderId: string): Promise<OrderDetailResult | null>;

  /**
   * Get order detail by order number
   */
  getOrderDetailByOrderNumber(
    orderNumber: string,
  ): Promise<OrderDetailResult | null>;

  /**
   * Get orders by user ID
   */
  getOrdersByUserId(
    userId: string,
    options?: FindAllOrdersQueryOptions,
  ): Promise<FindAllOrdersQueryResult>;

  /**
   * Search orders by criteria
   */
  searchOrders(
    criteria: OrderSearchCriteria,
  ): Promise<FindAllOrdersQueryResult>;

  /**
   * Count orders by criteria
   */
  count(criteria: OrderSearchCriteria): Promise<number>;
}
