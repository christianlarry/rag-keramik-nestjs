import { Inject, Injectable } from "@nestjs/common";
import {
  ApplicationArea,
  FinishingType,
  Grade,
  PRODUCT_REPOSITORY_TOKEN,
  ProductNotFoundError,
  ProductId,
  ProductName,
  ProductAttributes,
  type ProductRepository,
} from "../../domain";
import { ProductSize } from "../../domain/value-objects/product-size.vo";
import { DimensionUnit } from "../../domain/value-objects/dimension-unit.vo";

interface UpdateProductCommand {
  productId: string;
  name?: string;
  description?: string;
  brand?: string;
  imageUrl?: string;
  price?: number;
  currency?: string;
  tilePerBox?: number;
  size?: {
    width?: number;
    height?: number;
    thickness?: number;
    unit?: string;
  }
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
  };
}

interface UpdateProductResult {
  fieldsUpdated: string[];
  timestamp: Date;
  product: {
    id: string;
    name: string;
    description: string | null;
    brand: string | null;
    imageUrl: string | null;
    price: number;
    currency: string;
    tilePerBox: number;
    status: string;
    size: {
      width: number;
      height: number;
      thickness: number | null;
      unit: string;
    };
    attributes: {
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
    };
    updatedAt: Date;
  };
}

@Injectable()
export class UpdateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY_TOKEN)
    private readonly productRepository: ProductRepository,
  ) { }

  async execute(command: UpdateProductCommand): Promise<UpdateProductResult> {
    // ── Fetch product from repository ──────────────────────────────────────
    const productId = ProductId.fromString(command.productId);
    const product = await this.productRepository.findById(productId);

    if (!product) {
      throw new ProductNotFoundError(command.productId);
    }

    // ── Track which fields are being updated ───────────────────────────────
    const fieldsUpdated: string[] = [];

    // ── Build UpdateProductParams with only provided fields ────────────────
    const updateParams: Partial<{
      name: ProductName;
      description: string | undefined;
      brand: string | undefined;
      imageUrl: string | undefined;
      tilePerBox: number;
      attributes: ProductAttributes;
    }> = {};

    if (command.name !== undefined) {
      updateParams.name = ProductName.create(command.name);
      fieldsUpdated.push('name');
    }

    if (command.description !== undefined) {
      updateParams.description = command.description;
      fieldsUpdated.push('description');
    }

    if (command.brand !== undefined) {
      updateParams.brand = command.brand;
      fieldsUpdated.push('brand');
    }

    if (command.imageUrl !== undefined) {
      updateParams.imageUrl = command.imageUrl;
      fieldsUpdated.push('imageUrl');
    }

    if (command.tilePerBox !== undefined) {
      updateParams.tilePerBox = command.tilePerBox;
      fieldsUpdated.push('tilePerBox');
    }

    // ── Handle size + attributes update ────────────────────────────────────
    if (command.size || command.attributes) {
      const currentSize = product.size;
      const currentAttrs = product.attributes.getAttributes();

      // Merge size: use provided values or fallback to current
      const mergedSize = {
        width: command.size?.width ?? currentSize.getWidth(),
        height: command.size?.height ?? currentSize.getHeight(),
        thickness: command.size?.thickness ?? currentSize.getThickness(),
        unit: command.size?.unit ?? currentSize.getDimensionUnit().getValue(),
      };

      const dimensionUnit = DimensionUnit.fromString(mergedSize.unit);
      const newSize = ProductSize.create({
        width: mergedSize.width,
        height: mergedSize.height,
        thickness: mergedSize.thickness,
        dimensionUnit,
      });

      if (command.size) {
        fieldsUpdated.push('size');
      }

      // Merge attributes: use provided values or fallback to current
      const mergedAttributes = {
        size: newSize,
        grade: command.attributes?.grade ?? currentAttrs.grade,
        finishing: command.attributes?.finishing ?? currentAttrs.finishing,
        applicationAreas:
          command.attributes?.applicationAreas ?? currentAttrs.applicationAreas,
        antiSlipRating:
          command.attributes?.antiSlipRating ?? currentAttrs.antiSlipRating,
        waterAbsorption:
          command.attributes?.waterAbsorption ?? currentAttrs.waterAbsorption,
        color: command.attributes?.color ?? currentAttrs.color,
        pattern: command.attributes?.pattern ?? currentAttrs.pattern,
        isOutdoor:
          command.attributes?.isOutdoor ?? currentAttrs.isOutdoor,
        frostResistant:
          command.attributes?.frostResistant ?? currentAttrs.frostResistant,
        peiRating: command.attributes?.peiRating ?? currentAttrs.peiRating,
      };

      updateParams.attributes = ProductAttributes.create(mergedAttributes);

      if (command.attributes) {
        fieldsUpdated.push('attributes');
      }
    }

    // ── Update product information ────────────────────────────────────────
    if (Object.keys(updateParams).length > 0) {
      product.updateInfo(updateParams);
    }

    // ── Handle price update separately ────────────────────────────────────
    if (command.price !== undefined) {
      const currency = command.currency ?? product.price.getCurrency();
      product.updatePrice(command.price, currency);
      fieldsUpdated.push('price');
    }

    // ── Persist changes ───────────────────────────────────────────────────
    await this.productRepository.save(product);

    // ── Build and return result ───────────────────────────────────────────
    const size = product.size;
    const attrs = product.attributes.getAttributes();

    return {
      fieldsUpdated,
      timestamp: new Date(),
      product: {
        id: product.id.getValue(),
        name: product.name.getValue(),
        description: product.description,
        brand: product.brand,
        imageUrl: product.imageUrl,
        price: product.price.getAmount(),
        currency: product.price.getCurrency(),
        tilePerBox: product.tilePerBox,
        status: product.status.getValue(),
        size: {
          width: size.getWidth(),
          height: size.getHeight(),
          thickness: size.getThickness(),
          unit: size.getDimensionUnit().getValue(),
        },
        attributes: {
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
        },
        updatedAt: product.updatedAt,
      },
    };
  }
}