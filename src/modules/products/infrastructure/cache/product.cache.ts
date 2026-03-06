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
  static readonly PRODUCT_LIST_PREFIX = 'product:list:';
  static readonly PRODUCT_LIST_VERSION_KEY = 'product:list:version';

  // ===== TTL Configurations (in seconds) ===== //
  static readonly PRODUCT_DETAIL_TTL = 300; // 5 minutes
  static readonly PRODUCT_LIST_TTL = 60; // 1 minute – lists change more frequently

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

  /**
   * Get the version key used for list cache invalidation.
   * Increment this key (INCR) whenever a product is created, updated, or deleted
   * to automatically invalidate all cached product lists.
   */
  static getProductListVersionKey(): string {
    return this.PRODUCT_LIST_VERSION_KEY;
  }

  /**
   * Generate a versioned cache key for a product list query.
   * The version prefix ensures stale lists are never returned after mutations.
   *
   * @param params.version - Current version number from getProductListVersionKey()
   */
  static getProductListKey(params: {
    page?: number;
    limit?: number;
    status?: string;
    brand?: string;
    sortBy?: string;
    sortOrder?: string;
    version?: number;
    filtersHash?: string;
  }): string {
    const {
      page = 1,
      limit = 10,
      status,
      brand,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      version = 0,
      filtersHash,
    } = params;

    const parts: string[] = [
      `v${version}`,
      `page:${page}`,
      `limit:${limit}`,
      `sort:${sortBy}:${sortOrder}`,
    ];

    if (status) parts.push(`status:${status}`);
    if (brand) parts.push(`brand:${brand.toLowerCase()}`);
    if (filtersHash) parts.push(`f:${filtersHash}`);

    return `${this.PRODUCT_LIST_PREFIX}${parts.join(':')}`;
  }

  // ===== Cache Invalidation Helpers ===== //

  /**
   * Get all cache keys to delete when a product is created, updated, or deleted.
   *
   * NOTE: For list caches, do NOT delete list keys directly. Instead, call:
   *   await cache.incr(ProductCache.getProductListVersionKey())
   * This increments the version counter so all list cache keys become stale
   * automatically, without needing wildcard deletion.
   */
  static getInvalidationKeys(productId: string, sku?: string): string[] {
    const keys = [this.getProductByIdKey(productId)];

    if (sku) {
      keys.push(this.getProductBySKUKey(sku));
    }

    return keys;
  }
}
