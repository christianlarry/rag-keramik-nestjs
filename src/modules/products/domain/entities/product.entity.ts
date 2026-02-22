import { AggregateRoot } from 'src/core/domain/aggregate-root.base';
import {
  ProductId,
  SKU,
  ProductName,
  Price,
  ProductAttributes,
  ProductStatus,
} from '../value-objects';
import {
  InvalidStatusTransitionError,
  ProductIsDiscontinuedError,
} from '../errors';
import {
  ProductCreatedEvent,
  ProductUpdatedEvent,
  ProductDeletedEvent,
  ProductActivatedEvent,
  ProductDeactivatedEvent,
  ProductDiscontinuedEvent,
  ProductPriceChangedEvent,
  ProductOutOfStockEvent,
  ProductBackInStockEvent,
  ProductImageUpdatedEvent,
} from '../events';
import { ProductStateConflictError } from '../errors/product-state-conflict.error';
import { ProductSize } from '../value-objects/product-size.vo';

interface ProductProps {
  sku: SKU;
  name: ProductName;
  description: string | null;
  brand: string | null;
  imageUrl: string | null;
  price: Price;
  tilePerBox: number;
  attributes: ProductAttributes;
  status: ProductStatus;
  readonly createdAt: Date;
  updatedAt: Date;
}

interface CreateProductParams {
  sku: SKU;
  name: ProductName;
  description?: string;
  brand?: string;
  imageUrl?: string;
  price: Price;
  tilePerBox: number;
  attributes: ProductAttributes;
}

interface UpdateProductParams {
  name?: ProductName;
  description?: string;
  brand?: string;
  imageUrl?: string;
  tilePerBox?: number;
  attributes?: ProductAttributes;
}

export class Product extends AggregateRoot {
  private readonly _id: ProductId;
  private props: ProductProps;

  private constructor(id: ProductId, props: ProductProps) {
    super();
    this._id = id;
    this.props = props;
    this.validate();
  }

  private validate(): void {
    // Validate tile per box
    if (!Number.isInteger(this.props.tilePerBox)) {
      throw new ProductStateConflictError('Tile per box must be an integer');
    }

    if (this.props.tilePerBox <= 0) {
      throw new ProductStateConflictError('Tile per box must be greater than 0');
    }

    // Validate description length if provided
    if (
      this.props.description !== null &&
      this.props.description.trim().length === 0
    ) {
      throw new ProductStateConflictError(
        'Product description cannot be an empty string',
      );
    }

    // Validate brand length if provided
    if (
      this.props.brand !== null &&
      this.props.brand.trim().length === 0
    ) {
      throw new ProductStateConflictError(
        'Product brand cannot be an empty string',
      );
    }

    // Validate imageUrl format if provided
    if (this.props.imageUrl !== null) {
      if (this.props.imageUrl.trim().length === 0) {
        throw new ProductStateConflictError(
          'Product image URL cannot be an empty string',
        );
      }

      try {
        new URL(this.props.imageUrl);
      } catch {
        throw new ProductStateConflictError(
          'Product image URL must be a valid URL',
        );
      }
    }

    // Validate timestamps are valid dates
    if (!(this.props.createdAt instanceof Date) || isNaN(this.props.createdAt.getTime())) {
      throw new ProductStateConflictError('Product created date is invalid');
    }

    if (!(this.props.updatedAt instanceof Date) || isNaN(this.props.updatedAt.getTime())) {
      throw new ProductStateConflictError('Product updated date is invalid');
    }

    // Ensure updatedAt is not before createdAt
    if (this.props.updatedAt < this.props.createdAt) {
      throw new ProductStateConflictError(
        'Updated date cannot be before created date',
      );
    }
  }

  // ============================================
  // Factory Methods
  // ============================================

  /**
   * Create a new product
   */
  public static create(params: CreateProductParams): Product {
    const productId = ProductId.generate();

    const product = new Product(productId, {
      sku: params.sku,
      name: params.name,
      description: params.description || null,
      brand: params.brand || null,
      imageUrl: params.imageUrl || null,
      price: params.price,
      tilePerBox: params.tilePerBox,
      attributes: params.attributes,
      status: ProductStatus.createActive(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Emit domain event
    product.addDomainEvent(
      new ProductCreatedEvent({
        productId: productId.getValue(),
        sku: params.sku.getValue(),
        name: params.name.getValue(),
        price: params.price.getAmount(),
        currency: params.price.getCurrency(),
        brand: params.brand,
        status: product.props.status.getValue(),
      }),
    );

    return product;
  }

  /**
   * Reconstruct product from persistence
   */
  public static reconstruct(id: string, props: ProductProps): Product {
    return new Product(ProductId.fromString(id), props);
  }

  // ============================================
  // Query Methods - Status Checks
  // ============================================

  public isActive(): boolean {
    return this.props.status.isActive();
  }

  public isInactive(): boolean {
    return this.props.status.isInactive();
  }

  public isDiscontinued(): boolean {
    return this.props.status.isDiscontinued();
  }

  public isOutOfStock(): boolean {
    return this.props.status.isOutOfStock();
  }

  public isAvailableForPurchase(): boolean {
    return this.isActive();
  }

  // ============================================
  // Query Methods - Capability Checks
  // ============================================

  public canBeActivated(): boolean {
    return this.props.status.isInactive() || this.props.status.isOutOfStock();
  }

  public canBeDeactivated(): boolean {
    return this.props.status.isActive();
  }

  public canBeDiscontinued(): boolean {
    return !this.props.status.isDiscontinued();
  }

  public canBeModified(): boolean {
    return !this.props.status.isDiscontinued();
  }

  // ============================================
  // Ensure Invariants Methods
  // ============================================

  private ensureNotDiscontinued(): void {
    if (this.props.status.isDiscontinued()) {
      throw new ProductIsDiscontinuedError(this._id.getValue());
    }
  }

  private ensureCanBeModified(): void {
    this.ensureNotDiscontinued();
  }

  // ============================================
  // Command Methods - Update Product Info
  // ============================================

  /**
   * Update product information
   */
  public updateInfo(params: UpdateProductParams): void {
    this.ensureCanBeModified();

    const changes: Record<string, boolean> = {};

    if (
      params.name !== undefined &&
      !params.name.equals(this.props.name)
    ) {
      this.props.name = params.name;
      changes.name = true;
    }

    if (
      params.description !== undefined &&
      params.description !== this.props.description
    ) {
      this.props.description = params.description;
      changes.description = true;
    }

    if (params.brand !== undefined && params.brand !== this.props.brand) {
      this.props.brand = params.brand;
      changes.brand = true;
    }

    if (
      params.imageUrl !== undefined &&
      params.imageUrl !== this.props.imageUrl
    ) {
      const oldImageUrl = this.props.imageUrl;
      this.props.imageUrl = params.imageUrl;
      changes.imageUrl = true;

      // Emit image updated event
      this.addDomainEvent(
        new ProductImageUpdatedEvent({
          productId: this._id.getValue(),
          sku: this.props.sku.getValue(),
          oldImageUrl: oldImageUrl || undefined,
          newImageUrl: params.imageUrl || undefined,
        }),
      );
    }

    if (
      params.tilePerBox !== undefined &&
      params.tilePerBox !== this.props.tilePerBox
    ) {
      if (params.tilePerBox <= 0) {
        throw new ProductStateConflictError('Tile per box must be greater than 0');
      }
      this.props.tilePerBox = params.tilePerBox;
      changes.tilePerBox = true;
    }

    if (params.attributes !== undefined) {
      if (!params.attributes.equals(this.props.attributes)) {
        this.props.attributes = params.attributes;
        changes.attributes = true;
      }
    }

    if (Object.keys(changes).length > 0) {
      this.applyChange();
    }
  }

  /**
   * Update product price
   */
  public updatePrice(newPrice: number, currency?: string): void {
    this.ensureCanBeModified();

    const price = Price.create(
      newPrice,
      currency || this.props.price.getCurrency(),
    );

    if (!price.equals(this.props.price)) {
      const oldPrice = this.props.price;
      this.props.price = price;
      this.applyChange();

      // Emit price changed event
      this.addDomainEvent(
        new ProductPriceChangedEvent({
          productId: this._id.getValue(),
          sku: this.props.sku.getValue(),
          oldPrice: oldPrice.getAmount(),
          newPrice: price.getAmount(),
          currency: price.getCurrency(),
        }),
      );
    }
  }

  /**
   * Update product image
   */
  public updateImage(imageUrl: string | null): void {
    this.ensureCanBeModified();

    if (imageUrl !== this.props.imageUrl) {
      const oldImageUrl = this.props.imageUrl;
      this.props.imageUrl = imageUrl;
      this.applyChange();

      this.addDomainEvent(
        new ProductImageUpdatedEvent({
          productId: this._id.getValue(),
          sku: this.props.sku.getValue(),
          oldImageUrl: oldImageUrl || undefined,
          newImageUrl: imageUrl || undefined,
        }),
      );
    }
  }

  // ============================================
  // Command Methods - Status Transitions
  // ============================================

  /**
   * Activate the product
   */
  public activate(): void {
    if (this.props.status.isActive()) {
      return; // Already active
    }

    const previousStatus = this.props.status;
    this.changeStatus(ProductStatus.createActive());

    this.applyChange();

    this.addDomainEvent(
      new ProductActivatedEvent({
        productId: this._id.getValue(),
        sku: this.props.sku.getValue(),
        previousStatus: previousStatus.getValue(),
      }),
    );

    // If transitioning from OUT_OF_STOCK, emit back in stock event
    if (previousStatus.isOutOfStock()) {
      this.addDomainEvent(
        new ProductBackInStockEvent({
          productId: this._id.getValue(),
          sku: this.props.sku.getValue(),
          name: this.props.name.getValue(),
        }),
      );
    }
  }

  /**
   * Deactivate the product
   */
  public deactivate(reason?: string): void {
    if (this.props.status.isInactive()) {
      return; // Already inactive
    }

    this.ensureNotDiscontinued();

    const previousStatus = this.props.status;
    this.changeStatus(ProductStatus.createInactive());

    this.applyChange();

    this.addDomainEvent(
      new ProductDeactivatedEvent({
        productId: this._id.getValue(),
        sku: this.props.sku.getValue(),
        previousStatus: previousStatus.getValue(),
        reason,
      }),
    );
  }

  /**
   * Mark product as out of stock
   */
  public markAsOutOfStock(): void {
    if (this.props.status.isOutOfStock()) {
      return; // Already out of stock
    }

    this.ensureNotDiscontinued();

    const previousStatus = this.props.status;
    this.changeStatus(ProductStatus.createOutOfStock());

    this.applyChange();

    this.addDomainEvent(
      new ProductOutOfStockEvent({
        productId: this._id.getValue(),
        sku: this.props.sku.getValue(),
        name: this.props.name.getValue(),
        previousStatus: previousStatus.getValue(),
      }),
    );
  }

  /**
   * Discontinue the product (terminal status)
   */
  public discontinue(reason?: string): void {
    if (this.props.status.isDiscontinued()) {
      return; // Already discontinued
    }

    const previousStatus = this.props.status;
    this.props.status = ProductStatus.createDiscontinued();
    this.applyChange();

    this.addDomainEvent(
      new ProductDiscontinuedEvent({
        productId: this._id.getValue(),
        sku: this.props.sku.getValue(),
        name: this.props.name.getValue(),
        previousStatus: previousStatus.getValue(),
        reason,
      }),
    );
  }

  /**
   * Delete the product
   */
  public delete(): void {
    this.addDomainEvent(
      new ProductDeletedEvent({
        productId: this._id.getValue(),
        sku: this.props.sku.getValue(),
        name: this.props.name.getValue(),
      }),
    );
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  private changeStatus(newStatus: ProductStatus): void {
    if (!this.props.status.canTransitionTo(newStatus)) {
      throw new InvalidStatusTransitionError(
        this.props.status.getValue(),
        newStatus.getValue(),
      );
    }

    this.props.status = newStatus;
  }

  private applyChange(changes: Partial<Record<keyof ProductProps, boolean>> = {}): void {
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new ProductUpdatedEvent({
        productId: this._id.getValue(),
        sku: this.props.sku.getValue(),
        changes,
        updatedAt: this.props.updatedAt,
      }),
    );
  }

  // ===== Getters ===== //
  public get id(): ProductId { return this._id; }
  public get sku(): SKU { return this.props.sku; }
  public get name(): ProductName { return this.props.name; }
  public get description(): string | null { return this.props.description; }
  public get brand(): string | null { return this.props.brand; }
  public get imageUrl(): string | null { return this.props.imageUrl; }
  public get price(): Price { return this.props.price; }
  public get tilePerBox(): number { return this.props.tilePerBox; }
  public get attributes(): ProductAttributes { return this.props.attributes; }
  public get size(): ProductSize { return this.attributes.getSize() }
  public get status(): ProductStatus { return this.props.status; }
  public get createdAt(): Date { return this.props.createdAt; }
  public get updatedAt(): Date { return this.props.updatedAt; }
}
