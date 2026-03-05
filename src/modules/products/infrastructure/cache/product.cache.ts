/**
 * ProductCache
 *
 * Utility class for managing product-related cache keys and TTL configurations.
 * Provides static methods for generating cache keys with consistent prefixes.
 *
 * Pattern mirrors UserCache from the users domain.
 */
export class ProductCache {
  // ===== Cache Key Prefixes ===== //
  static readonly PRODUCT_BY_ID_PREFIX = 'product:id:';
  static readonly PRODUCT_BY_SKU_PREFIX = 'product:sku:';

  // ===== TTL Configurations (in seconds) ===== //
  static readonly PRODUCT_DETAIL_TTL = 300; // 5 minutes

  // ===== Key Generator Methods ===== //

  /**
   * Generate cache key for product by ID
   */
  static getProductByIdKey(productId: string): string {
    return `${this.PRODUCT_BY_ID_PREFIX}${productId}`;
  }

  /**
   * Generate cache key for product by SKU
   */
  static getProductBySKUKey(sku: string): string {
    return `${this.PRODUCT_BY_SKU_PREFIX}${sku.toUpperCase()}`;
  }

  // ===== Cache Invalidation Helpers ===== //

  /**
   * Get all cache keys that should be invalidated when a product is created/updated/deleted.
   * @param productId - ID of the product
   * @param sku - SKU of the product (optional, but should be provided when available)
   */
  static getInvalidationKeys(productId: string, sku?: string): string[] {
    const keys = [this.getProductByIdKey(productId)];

    if (sku) {
      keys.push(this.getProductBySKUKey(sku));
    }

    return keys;
  }
}
