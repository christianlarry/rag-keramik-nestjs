import { Injectable } from "@nestjs/common";
import {
  FindAllProductsQueryOptions,
  FindAllProductsQueryResult,
  ProductDetailResult,
  ProductListItemResult,
  ProductQueryRepository,
  ProductStatusType,
} from "../../domain";
import { PrismaService } from "src/core/infrastructure/persistence/prisma/prisma.service";
import { CacheService } from "src/core/infrastructure/services/cache/cache.service";
import { ProductCache } from "../cache/product.cache";
import { RawProductAttributes } from "../mappers/prisma-product.mapper";

// Prisma Decimal returned as an object with toNumber()
type PrismaDecimal = { toNumber(): number };

/** Shared Prisma select for query-side product reads (no deletedAt needed). */
const PRODUCT_QUERY_SELECT = {
  id: true,
  sku: true,
  name: true,
  description: true,
  brand: true,
  imageUrl: true,
  price: true,
  tilePerBox: true,
  currency: true,
  attributes: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

type RawQueryProduct = {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  brand: string | null;
  imageUrl: string | null;
  price: PrismaDecimal | number;
  tilePerBox: number;
  currency: string;
  attributes: any;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

/** Direct column fields that Prisma can sort by without JSON access. */
const DIRECT_SORT_FIELDS = new Set(['price', 'createdAt', 'updatedAt', 'name', 'brand']);

@Injectable()
export class PrismaProductQueryRepository implements ProductQueryRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) { }

  // ===== Public methods =====

  async findAllProducts(
    options?: FindAllProductsQueryOptions,
  ): Promise<FindAllProductsQueryResult> {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 10;
    const skip = (page - 1) * limit;
    const sortBy = options?.sortOptions?.sortBy ?? 'createdAt';
    const sortOrder = options?.sortOptions?.sortOrder ?? 'desc';

    const where = this.buildWhereClause(options);
    const orderBy = DIRECT_SORT_FIELDS.has(sortBy)
      ? { [sortBy]: sortOrder }
      : { createdAt: 'desc' as const }; // relevance / popularity / size → fallback

    // Version-based cache keying: increment version on any product mutation
    const listVersionKey: string = ProductCache.getProductListVersionKey();
    const version = (await this.cache.get<number>(listVersionKey)) ?? 0;

    const filtersHash = this.buildFiltersHash(options);
    const cacheKey: string = ProductCache.getProductListKey({
      page,
      limit,
      status: options?.status,
      brand: options?.brand,
      sortBy,
      sortOrder,
      version,
      filtersHash,
    });

    const listTTL: number = ProductCache.PRODUCT_LIST_TTL;
    const result = await this.cache.wrap<{ products: RawQueryProduct[]; total: number }>(
      cacheKey,
      async () => {
        const [total, products] = (await Promise.all([
          this.prisma.getClient().product.count({ where }),
          this.prisma.getClient().product.findMany({
            where,
            skip,
            take: limit,
            orderBy,
            select: PRODUCT_QUERY_SELECT,
          }),
        ])) as [number, RawQueryProduct[]];

        return { products, total };
      },
      listTTL,
    );

    return {
      products: result.products.map((p) =>
        this.mapToListItem(p as RawQueryProduct),
      ),
      total: result.total,
    };
  }

  async getProductDetailById(
    productId: string,
  ): Promise<ProductDetailResult | null> {
    const cacheKey = ProductCache.getProductByIdKey(productId);

    const raw = await this.cache.wrap(
      cacheKey,
      async () =>
        this.prisma.getClient().product.findUnique({
          where: { id: productId, status: { not: 'DELETED' } },
          select: PRODUCT_QUERY_SELECT,
        }),
      ProductCache.PRODUCT_DETAIL_TTL,
    );

    return raw ? this.mapToDetailResult(raw as RawQueryProduct) : null;
  }

  async getProductDetailBySKU(sku: string): Promise<ProductDetailResult | null> {
    const cacheKey = ProductCache.getProductBySKUKey(sku);

    const raw = await this.cache.wrap(
      cacheKey,
      async () =>
        this.prisma.getClient().product.findUnique({
          where: { sku, status: { not: 'DELETED' } },
          select: PRODUCT_QUERY_SELECT,
        }),
      ProductCache.PRODUCT_DETAIL_TTL,
    );

    return raw ? this.mapToDetailResult(raw as RawQueryProduct) : null;
  }

  // ===== Private helpers =====

  /**
   * Build the Prisma WHERE clause from all provided query options.
   * Uses `any` to accommodate Prisma JSON path filter syntax which lies
   * outside the strictly-typed ProductWhereInput surface.
   */
  private buildWhereClause(options?: FindAllProductsQueryOptions): any {
    const where: any = {};

    // Status – exclude DELETED by default
    where.status = options?.status ? options.status : { not: 'DELETED' };

    // Brand – case-insensitive partial match
    if (options?.brand) {
      where.brand = { contains: options.brand, mode: 'insensitive' };
    }

    // Price range
    if (options?.priceRange) {
      const { min, max } = options.priceRange;
      if (min !== undefined || max !== undefined) {
        where.price = {};
        if (min !== undefined) where.price.gte = min;
        if (max !== undefined) where.price.lte = max;
      }
    }

    // JSON path conditions for size & attributes (AND-combined)
    const andConditions: any[] = [];

    if (options?.size) {
      const { minWidth, maxWidth, minHeight, maxHeight, minThickness, maxThickness, unit } =
        options.size;
      if (minWidth !== undefined)
        andConditions.push({ attributes: { path: ['width'], gte: minWidth } });
      if (maxWidth !== undefined)
        andConditions.push({ attributes: { path: ['width'], lte: maxWidth } });
      if (minHeight !== undefined)
        andConditions.push({ attributes: { path: ['height'], gte: minHeight } });
      if (maxHeight !== undefined)
        andConditions.push({ attributes: { path: ['height'], lte: maxHeight } });
      if (minThickness !== undefined)
        andConditions.push({ attributes: { path: ['thickness'], gte: minThickness } });
      if (maxThickness !== undefined)
        andConditions.push({ attributes: { path: ['thickness'], lte: maxThickness } });
      if (unit)
        andConditions.push({ attributes: { path: ['unit'], equals: unit } });
    }

    if (options?.attributes) {
      const {
        grade,
        finishing,
        applicationAreas,
        antiSlipRating,
        waterAbsorption,
        color,
        pattern,
        isOutdoor,
        frostResistant,
        peiRating,
      } = options.attributes;

      if (grade)
        andConditions.push({ attributes: { path: ['grade'], equals: grade } });
      if (finishing)
        andConditions.push({ attributes: { path: ['finishing'], equals: finishing } });
      // All specified areas must be present in the product's applicationAreas array
      if (applicationAreas?.length) {
        for (const area of applicationAreas) {
          andConditions.push({
            attributes: { path: ['applicationAreas'], array_contains: area },
          });
        }
      }
      if (antiSlipRating)
        andConditions.push({
          attributes: { path: ['antiSlipRating'], equals: antiSlipRating },
        });
      if (waterAbsorption)
        andConditions.push({
          attributes: { path: ['waterAbsorption'], equals: waterAbsorption },
        });
      if (color)
        andConditions.push({
          attributes: { path: ['color'], string_contains: color },
        });
      if (pattern)
        andConditions.push({
          attributes: { path: ['pattern'], string_contains: pattern },
        });
      if (isOutdoor !== undefined)
        andConditions.push({
          attributes: { path: ['isOutdoor'], equals: isOutdoor },
        });
      if (frostResistant !== undefined)
        andConditions.push({
          attributes: { path: ['frostResistant'], equals: frostResistant },
        });
      if (peiRating !== undefined)
        andConditions.push({
          attributes: { path: ['peiRating'], equals: peiRating },
        });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    return where;
  }

  /**
   * Build a short, stable hash string for complex (JSON-path) filters so they
   * can be encoded into the cache key.  Returns undefined when no complex
   * filters are active, keeping the key compact for typical list queries.
   */
  private buildFiltersHash(options?: FindAllProductsQueryOptions): string | undefined {
    const complex = {
      priceRange: options?.priceRange,
      size: options?.size,
      attributes: options?.attributes,
    };

    const hasComplex = Object.values(complex).some((v) => v !== undefined);
    if (!hasComplex) return undefined;

    // Deterministic serialization → base-64 URL-safe (no crypto dependency)
    return Buffer.from(JSON.stringify(complex)).toString('base64url').slice(0, 32);
  }

  /** Extract size sub-object from the flat JSON attributes blob. */
  private extractSize(attrs: RawProductAttributes | null): ProductDetailResult['size'] {
    return {
      width: attrs?.width ?? 0,
      height: attrs?.height ?? 0,
      thickness: attrs?.thickness ?? null,
      unit: attrs?.unit ?? 'cm',
    };
  }

  private mapToListItem(raw: RawQueryProduct): ProductListItemResult {
    const attrs = raw.attributes as RawProductAttributes | null;
    return {
      id: raw.id,
      sku: raw.sku,
      name: raw.name,
      description: raw.description,
      brand: raw.brand,
      imageUrl: raw.imageUrl,
      price:
        typeof raw.price === 'number'
          ? raw.price
          : (raw.price as PrismaDecimal).toNumber(),
      currency: raw.currency,
      tilePerBox: raw.tilePerBox,
      status: raw.status as ProductStatusType,
      size: this.extractSize(attrs),
      attributes: (attrs as unknown as Record<string, unknown>) ?? {},
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }

  private mapToDetailResult(raw: RawQueryProduct): ProductDetailResult {
    const attrs = raw.attributes as RawProductAttributes | null;
    return {
      id: raw.id,
      sku: raw.sku,
      name: raw.name,
      description: raw.description,
      brand: raw.brand,
      imageUrl: raw.imageUrl,
      price:
        typeof raw.price === 'number'
          ? raw.price
          : (raw.price as PrismaDecimal).toNumber(),
      currency: raw.currency,
      tilePerBox: raw.tilePerBox,
      status: raw.status as ProductStatusType,
      size: this.extractSize(attrs),
      attributes: (attrs as unknown as Record<string, unknown>) ?? {},
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }
}
