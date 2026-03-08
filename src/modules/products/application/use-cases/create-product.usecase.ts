import { Inject, Injectable } from "@nestjs/common";
import {
  Product,
  PRODUCT_REPOSITORY_TOKEN,
  ProductAlreadyExistsError,
  SKU,
  type ProductRepository,
  ProductName,
  Price,
  ProductAttributes,
  Grade,
  FinishingType,
  ApplicationArea,
} from "../../domain";
import { ProductSize } from "../../domain/value-objects/product-size.vo";
import { DimensionUnit } from "../../domain/value-objects/dimension-unit.vo";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { ProductCreatedAppEvent } from "../events/product-created-app.event";

interface CreateProductCommand {
  // Actor who create the product, for auditing purposes
  createdBy: string; // e.g. user ID or system identifier

  sku: string;
  name: string;
  description?: string;
  brand?: string;
  imageUrl?: string;
  price: number;
  currency?: string;
  tilePerBox: number;
  size: {
    width: number;
    height: number;
    thickness: number;
    unit: string;
  }
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
}

interface CreateProductResult {
  id: string;
  name: string;
  sku: string;
}

@Injectable()
export class CreateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY_TOKEN)
    private readonly productRepository: ProductRepository,
    private readonly eventEmitter: EventEmitter2,
  ) { }

  async execute(command: CreateProductCommand): Promise<CreateProductResult> {
    // ── Validate SKU uniqueness ────────────────────────────────────────────
    const sku = SKU.create(command.sku);
    const existing = await this.productRepository.existsBySKU(sku);

    if (existing) {
      throw new ProductAlreadyExistsError(sku.getValue());
    }

    // ── Instantiate value objects ──────────────────────────────────────────
    const name = ProductName.create(command.name);
    const price = Price.create(command.price, command.currency || 'IDR');

    // Size Value Object
    const dimensionUnit = DimensionUnit.fromString(command.size.unit);
    const tileSize = ProductSize.create({
      width: command.size.width,
      height: command.size.height,
      thickness: command.size.thickness,
      dimensionUnit: dimensionUnit,
    });

    // Attributes Value Object
    const attributes = ProductAttributes.create({
      size: tileSize,
      ...command.attributes,
    });

    // ── Create domain entity ───────────────────────────────────────────────
    const product = Product.create({
      sku,
      name,
      description: command.description,
      brand: command.brand,
      imageUrl: command.imageUrl,
      price,
      tilePerBox: command.tilePerBox,
      attributes,
    });

    // ── Persist to repository ──────────────────────────────────────────────
    await this.productRepository.save(product);

    // Emit Application Event for Side Effects (e.g. cache invalidation, search indexing, etc.)
    this.eventEmitter.emit(
      ProductCreatedAppEvent.EventName,
      new ProductCreatedAppEvent({
        createdBy: command.createdBy,
        productId: product.id.getValue(),
      })
    );

    // ── Return result ──────────────────────────────────────────────────────
    return {
      id: product.id.getValue(),
      name: product.name.getValue(),
      sku: product.sku.getValue(),
    };
  }
}
