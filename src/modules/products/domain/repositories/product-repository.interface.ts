import { Product } from '../entities/product.entity';
import { SKU } from '../value-objects/sku.vo';
import { ProductId } from '../value-objects/product-id.vo';

/**
 * ProductRepository
 *
 * Repository untuk domain operations yang memerlukan full entity rehydration.
 * Digunakan untuk operasi write (create, update, delete) dan read yang memerlukan business logic.
 *
 * Pattern: Domain-Driven Design Repository
 * - Semua method return/accept domain entities
 * - Digunakan untuk command operations (write)
 * - Digunakan untuk read operations yang memerlukan business logic
 */
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
}

export const PRODUCT_REPOSITORY_TOKEN = 'PRODUCT_REPOSITORY';
