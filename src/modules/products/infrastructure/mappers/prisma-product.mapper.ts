import { Product } from '../../domain/entities/product.entity';
import {
  SKU,
  ProductName,
  Price,
  ProductAttributes,
  ProductStatus,
} from '../../domain/value-objects';
import { ProductSize } from '../../domain/value-objects/product-size.vo';
import { DimensionUnit } from '../../domain/value-objects/dimension-unit.vo';
import { DimensionUnit as DimensionUnitEnum } from '../../domain/enums/dimension-unit.enum';
import { Grade, FinishingType, ApplicationArea } from '../../domain/enums';

// Prisma Decimal is returned as an object with toNumber()
type PrismaDecimal = { toNumber(): number };

/**
 * Raw JSON structure stored in the `attributes` column of the Product table.
 * Combines dimensional info (size) and tile-specific attributes.
 */
export interface RawProductAttributes {
  // Size fields (flattened from ProductSize)
  width: number;
  height: number;
  thickness: number | null;
  unit: string; // DimensionUnitEnum value

  // Tile-specific attributes
  grade?: string;
  finishing?: string;
  applicationAreas?: string[];
  antiSlipRating?: string;
  waterAbsorption?: string;
  color?: string;
  pattern?: string;
  isOutdoor?: boolean;
  frostResistant?: boolean;
  peiRating?: number;
}

/**
 * Shape of a raw Prisma product record
 */
export interface RawProduct {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  brand: string | null;
  imageUrl: string | null;
  price: PrismaDecimal | number;
  tilePerBox: number;
  currency: string;
  attributes: any; // Prisma Json? – typed as `any` to be compatible with Prisma's NullableJsonNullValueInput | InputJsonValue
  status: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class PrismaProductMapper {
  /**
   * Map a raw Prisma product record to a Product domain entity.
   */
  static toDomain(raw: RawProduct): Product {
    // Parse the JSON attributes blob
    const rawAttrs = raw.attributes as RawProductAttributes | null;

    // Reconstruct size value object
    const dimensionUnit = DimensionUnit.create(
      (rawAttrs?.unit ?? DimensionUnitEnum.CENTIMETER) as DimensionUnitEnum,
    );

    const size = ProductSize.create({
      width: rawAttrs?.width ?? 0,
      height: rawAttrs?.height ?? 0,
      thickness: rawAttrs?.thickness ?? null,
      dimensionUnit,
    });

    // Reconstruct tile attributes value object
    const attributes = ProductAttributes.create({
      size,
      grade: rawAttrs?.grade as Grade | undefined,
      finishing: rawAttrs?.finishing as FinishingType | undefined,
      applicationAreas: rawAttrs?.applicationAreas as ApplicationArea[] | undefined,
      antiSlipRating: rawAttrs?.antiSlipRating,
      waterAbsorption: rawAttrs?.waterAbsorption,
      color: rawAttrs?.color,
      pattern: rawAttrs?.pattern,
      isOutdoor: rawAttrs?.isOutdoor,
      frostResistant: rawAttrs?.frostResistant,
      peiRating: rawAttrs?.peiRating,
    });

    // Resolve Prisma Decimal → number
    const priceAmount =
      typeof raw.price === 'object' && 'toNumber' in raw.price
        ? (raw.price as PrismaDecimal).toNumber()
        : (raw.price as number);

    return Product.reconstruct(raw.id, {
      sku: SKU.create(raw.sku),
      name: ProductName.create(raw.name),
      description: raw.description,
      brand: raw.brand,
      imageUrl: raw.imageUrl,
      price: Price.create(priceAmount, raw.currency),
      tilePerBox: raw.tilePerBox,
      attributes,
      status: ProductStatus.create(raw.status),
      createdAt: new Date(raw.createdAt),
      updatedAt: new Date(raw.updatedAt),
      deletedAt: raw.deletedAt ? new Date(raw.deletedAt) : null,
    });
  }

  /**
   * Map a Product domain entity to a raw Prisma persistence object.
   */
  static toPersistence(product: Product): Omit<RawProduct, 'price'> & { price: number } {
    const size = product.size;
    const attrs = product.attributes.getAttributes();

    // Serialize the full attributes blob (size + tile attributes)
    const attributesJson: RawProductAttributes = {
      width: size.getWidth(),
      height: size.getHeight(),
      thickness: size.getThickness(),
      unit: size.getDimensionUnit().getValue(),
      grade: attrs.grade,
      finishing: attrs.finishing,
      applicationAreas: attrs.applicationAreas,
      antiSlipRating: attrs.antiSlipRating,
      waterAbsorption: attrs.waterAbsorption,
      color: attrs.color,
      pattern: attrs.pattern,
      isOutdoor: attrs.isOutdoor,
      frostResistant: attrs.frostResistant,
      peiRating: attrs.peiRating,
    };

    return {
      id: product.id.getValue(),
      sku: product.sku.getValue(),
      name: product.name.getValue(),
      description: product.description,
      brand: product.brand,
      imageUrl: product.imageUrl,
      price: product.price.getAmount(),
      tilePerBox: product.tilePerBox,
      currency: product.price.getCurrency(),
      attributes: attributesJson as any, // Prisma Json?: cast for NullableJsonNullValueInput compatibility
      status: product.status.getValue(),
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      deletedAt: product.deletedAt ?? null,
    };
  }

  /**
   * Prisma select object for product queries.
   * Use as `{ select: PrismaProductMapper.productSelect }` in queries.
   */
  static readonly productSelect = {
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
    deletedAt: true,
  } as const;
}
