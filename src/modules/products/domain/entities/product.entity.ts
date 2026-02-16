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
  sku: string;
  name: string;
  description?: string;
  brand?: string;
  imageUrl?: string;
  price: number;
  currency?: string;
  tilePerBox: number;
  attributes?: Record<string, unknown>;
}

interface UpdateProductParams {
  name?: string;
  description?: string;
  brand?: string;
  imageUrl?: string;
  tilePerBox?: number;
  attributes?: Record<string, unknown>;
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
    if (this.props.tilePerBox <= 0) {
      throw new Error('Tile per box must be greater than 0');
    }

    // Ensure updatedAt is not before createdAt
    if (this.props.updatedAt < this.props.createdAt) {
      throw new Error('Updated date cannot be before created date');
    }
  }

  // ============================================
  // Factory Methods
  // ============================================

  /**
   * Create a new product
   */
  public static create(params: CreateProductParams): Product {
    const productId = ProductId.create();
    const sku = SKU.create(params.sku);
    const name = ProductName.create(params.name);
    const price = Price.create(params.price, params.currency);
    const attributes = ProductAttributes.create(params.attributes);

    const product = new Product(productId, {
      sku,
      name,
      description: params.description || null,
      brand: params.brand || null,
      imageUrl: params.imageUrl || null,
      price,
      tilePerBox: params.tilePerBox,
      attributes,
      status: ProductStatus.createActive(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Emit domain event
    product.addDomainEvent(
      new ProductCreatedEvent({
        productId: productId.getValue(),
        sku: sku.getValue(),
        name: name.getValue(),
        price: price.getAmount(),
        currency: price.getCurrency(),
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
  // Query Methods - Tile-Specific
  // ============================================

  public getSize(): string | undefined {
    return this.props.attributes.getSize();
  }

  public getGrade(): string | undefined {
    return this.props.attributes.getGrade();
  }

  public getFinishing(): string | undefined {
    return this.props.attributes.getFinishing();
  }

  public getApplicationAreas(): string[] | undefined {
    return this.props.attributes.getApplicationAreas();
  }

  public hasAttribute(key: string): boolean {
    return this.props.attributes.hasAttribute(key);
  }

  public getAttribute(key: string): unknown {
    return this.props.attributes.getAttribute(key);
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
      params.name !== this.props.name.getValue()
    ) {
      this.props.name = ProductName.create(params.name);
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
        throw new Error('Tile per box must be greater than 0');
      }
      this.props.tilePerBox = params.tilePerBox;
      changes.tilePerBox = true;
    }

    if (params.attributes !== undefined) {
      const newAttributes = ProductAttributes.create(params.attributes);
      if (!newAttributes.equals(this.props.attributes)) {
        this.props.attributes = newAttributes;
        changes.attributes = true;
      }
    }

    if (Object.keys(changes).length > 0) {
      this.applyChange();

      // Emit product updated event
      this.addDomainEvent(
        new ProductUpdatedEvent({
          productId: this._id.getValue(),
          sku: this.props.sku.getValue(),
          changes,
        }),
      );
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

      // Emit general product updated event
      this.addDomainEvent(
        new ProductUpdatedEvent({
          productId: this._id.getValue(),
          sku: this.props.sku.getValue(),
          changes: { price: true },
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
    this.applyChange();
  }

  private applyChange(): void {
    this.props.updatedAt = new Date();
    this.validate();
  }

  // ===== Getters ===== //
  public get id(): ProductId {
    return this._id;
  }

  public get sku(): SKU {
    return this.props.sku;
  }

  public get name(): ProductName {
    return this.props.name;
  }

  public get description(): string | null {
    return this.props.description;
  }

  public get brand(): string | null {
    return this.props.brand;
  }

  public get imageUrl(): string | null {
    return this.props.imageUrl;
  }

  public get price(): Price {
    return this.props.price;
  }

  public get tilePerBox(): number {
    return this.props.tilePerBox;
  }

  public get attributes(): ProductAttributes {
    return this.props.attributes;
  }

  public get status(): ProductStatus {
    return this.props.status;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
