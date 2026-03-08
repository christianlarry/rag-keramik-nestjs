import {
  ProductStatusType,
  FinishingType,
  Grade,
  ApplicationArea,
} from '../enums';
import { ProductStatus } from '../enums/product-status.enum';

// ===== Query Options =====
export interface FindAllProductsQueryOptions {
  page?: number;
  limit?: number;
  // Sorting options
  sortOptions: {
    sortBy: 'relevance' | 'price' | 'popularity' | 'createdAt' | 'updatedAt' | 'name' | 'brand' | 'size';
    sortOrder: 'asc' | 'desc';
  };
  status?: ProductStatus;
  brand?: string;
  priceRange?: {
    min?: number;
    max?: number;
  };
  // Tile-specific filters
  size?: {
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
    minThickness?: number;
    maxThickness?: number;
    unit?: string;
  };
  attributes?: {
    grade?: Grade;
    finishing?: FinishingType;
    applicationAreas?: ApplicationArea[];
    antiSlipRating?: string;
    waterAbsorption?: string;
    color?: string;
    pattern?: string;
    isOutdoor?: boolean;
    frostResistant?: boolean;
    peiRating?: number;
  }
}

// ===== Query Results =====
export interface ProductQueryListItemResult {
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
  size: {
    width: number;
    height: number;
    thickness: number | null;
    unit: string;
  };
  attributes: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface FindAllProductsQueryResult {
  products: ProductQueryListItemResult[];
  total: number;
}

export interface ProductQueryDetailResult {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  brand: string | null;
  imageUrl: string | null;
  price: number;
  currency: string;
  tilePerBox: number;
  size: {
    width: number;
    height: number;
    thickness: number | null;
    unit: string;
  };
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
  getProductDetailById(productId: string): Promise<ProductQueryDetailResult | null>;

  /**
   * Get product detail by SKU for display
   * Returns plain object with all product data
   */
  getProductDetailBySKU(sku: string): Promise<ProductQueryDetailResult | null>;
}
