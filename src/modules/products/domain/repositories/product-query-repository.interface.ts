import {
  ProductStatusType,
  FinishingType,
  Grade,
  ApplicationArea,
} from '../enums';

// ===== Query Options =====
export interface FindAllProductsQueryOptions {
  page?: number;
  limit?: number;
  status?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  // Tile-specific filters
  size?: string;
  grade?: string;
  finishing?: string;
  applicationArea?: string;
}

export interface ProductSearchCriteria {
  sku?: string;
  name?: string;
  brand?: string;
  status?: ProductStatusType;
  minPrice?: number;
  maxPrice?: number;
  // Tile-specific filters
  size?: string;
  grade?: Grade;
  finishing?: FinishingType;
  applicationArea?: ApplicationArea;
  // Pagination
  skip?: number;
  take?: number;
}

// ===== Query Results =====
export interface ProductListItemResult {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  brand: string | null;
  imageUrl: string | null;
  price: number;
  currency: string;
  tilePerBox: number;
  status: ProductStatusType;
  // Tile attributes (extracted for quick access)
  size?: string;
  grade?: Grade;
  finishing?: FinishingType;
  createdAt: Date;
  updatedAt: Date;
}

export interface FindAllProductsQueryResult {
  products: ProductListItemResult[];
  total: number;
}

export interface ProductDetailResult {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  brand: string | null;
  imageUrl: string | null;
  price: number;
  currency: string;
  tilePerBox: number;
  attributes: Record<string, unknown>;
  status: ProductStatusType;
  createdAt: Date;
  updatedAt: Date;
}

// ===== Repository Interface =====
export const PRODUCT_QUERY_REPOSITORY_TOKEN = 'PRODUCT_QUERY_REPOSITORY';

/**
 * ProductQueryRepository
 *
 * Repository khusus untuk query/read operations yang tidak memerlukan domain entity rehydration.
 * Digunakan untuk operasi list, search, dan reporting yang lebih ringan.
 *
 * Pattern: CQRS (Command Query Responsibility Segregation)
 * - Command Repository (ProductRepository): Write operations, domain entity focus
 * - Query Repository (ProductQueryRepository): Read operations, DTO/plain object focus
 */
export interface ProductQueryRepository {
  /**
   * Get paginated list of products for catalog display
   * Returns plain objects without domain entity rehydration for better performance
   */
  findAllProducts(
    options?: FindAllProductsQueryOptions,
  ): Promise<FindAllProductsQueryResult>;

  /**
   * Get product detail by ID for display
   * Returns plain object with all product data
   */
  getProductDetailById(productId: string): Promise<ProductDetailResult | null>;

  /**
   * Get product detail by SKU for display
   * Returns plain object with all product data
   */
  getProductDetailBySKU(sku: string): Promise<ProductDetailResult | null>;

  /**
   * Search products by criteria
   * Returns plain list for search results
   */
  searchProducts(
    criteria: ProductSearchCriteria,
  ): Promise<FindAllProductsQueryResult>;

  /**
   * Count products by criteria
   */
  count(criteria: ProductSearchCriteria): Promise<number>;
}
