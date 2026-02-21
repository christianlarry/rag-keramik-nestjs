// ===== Query Options =====
export interface FindAllInventoryQueryOptions {
  page?: number;
  limit?: number;
  lowStockThreshold?: number;
  productId?: string;
}

// ===== Query Results =====
export interface InventoryItemResult {
  id: string;
  productId: string;
  productName?: string;
  productSku?: string;
  stock: number;
  reserved: number;
  available: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface FindAllInventoryQueryResult {
  items: InventoryItemResult[];
  total: number;
}

export interface InventoryDetailResult {
  id: string;
  productId: string;
  productName?: string;
  productSku?: string;
  stock: number;
  reserved: number;
  available: number;
  createdAt: Date;
  updatedAt: Date;
}

// ===== Repository Interface =====
export const INVENTORY_QUERY_REPOSITORY_TOKEN = 'INVENTORY_QUERY_REPOSITORY';

/**
 * InventoryQueryRepository
 *
 * Repository khusus untuk query/read operations yang tidak memerlukan domain entity rehydration.
 *
 * Pattern: CQRS (Command Query Responsibility Segregation)
 */
export interface InventoryQueryRepository {
  /**
   * Get paginated list of inventory items
   */
  findAllInventory(
    options?: FindAllInventoryQueryOptions,
  ): Promise<FindAllInventoryQueryResult>;

  /**
   * Get inventory detail by product ID
   */
  getInventoryByProductId(
    productId: string,
  ): Promise<InventoryDetailResult | null>;

  /**
   * Get low stock items (below threshold)
   */
  getLowStockItems(
    threshold: number,
    limit?: number,
  ): Promise<InventoryItemResult[]>;
}
