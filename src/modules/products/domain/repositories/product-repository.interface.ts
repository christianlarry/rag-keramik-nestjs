import { Product } from '../entities/product.entity';
import { SKU } from '../value-objects/sku.vo';
import { ProductId } from '../value-objects/product-id.vo';
import { ProductStatus } from '../enums/product-status.enum';

export interface ProductSearchCriteria {
  sku?: string;
  name?: string;
  brand?: string;
  status?: ProductStatus;
  minPrice?: number;
  maxPrice?: number;
  // Tile-specific filters
  size?: string;
  grade?: string;
  finishing?: string;
  applicationArea?: string;
  // Pagination
  skip?: number;
  take?: number;
}

export interface ProductRepository {
  /**
   * Find a product by ID
   */
  findById(productId: ProductId): Promise<Product | null>;

  /**
   * Find a product by SKU
   */
  findBySKU(sku: SKU): Promise<Product | null>;

  /**
   * Find products by criteria
   */
  findByCriteria(criteria: ProductSearchCriteria): Promise<Product[]>;

  /**
   * Find all active products
   */
  findAllActive(): Promise<Product[]>;

  /**
   * Find products by brand
   */
  findByBrand(brand: string): Promise<Product[]>;

  /**
   * Find products by status
   */
  findByStatus(status: ProductStatus): Promise<Product[]>;

  /**
   * Check if SKU exists
   */
  existsBySKU(sku: SKU): Promise<boolean>;

  /**
   * Save a product (create or update)
   */
  save(product: Product): Promise<void>;

  /**
   * Delete a product
   */
  delete(productId: ProductId): Promise<void>;

  /**
   * Count products by criteria
   */
  count(criteria: ProductSearchCriteria): Promise<number>;

  /**
   * Count all products
   */
  countAll(): Promise<number>;
}

export const PRODUCT_REPOSITORY_TOKEN = 'PRODUCT_REPOSITORY';
