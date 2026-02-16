import { AggregateRoot } from 'src/core/domain/aggregate-root.base';
import { ProductId } from '../value-objects/product-id.vo';
import { SKU } from '../value-objects/sku.vo';
import { ProductName } from '../value-objects/product-name.vo';
import { Price } from '../value-objects/price.vo';
import { ProductAttributes } from '../value-objects/product-attributes.vo';
import { ProductStatus } from '../enums/product-status.enum';
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
  id: ProductId;
  sku: SKU;
  name: ProductName;
  description: string | null;
  brand: string | null;
  imageUrl: string | null;
  price: Price;
  tilePerBox: number;
  attributes: ProductAttributes;
  status: ProductStatus;
  createdAt: Date;
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
  private _sku: SKU;
  private _name: ProductName;
  private _description: string | null;
  private _brand: string | null;
  private _imageUrl: string | null;
  private _price: Price;
  private _tilePerBox: number;
  private _attributes: ProductAttributes;
  private _status: ProductStatus;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: ProductProps) {
    super();
    this._id = props.id;
    this._sku = props.sku;
    this._name = props.name;
    this._description = props.description;
    this._brand = props.brand;
    this._imageUrl = props.imageUrl;
    this._price = props.price;
    this._tilePerBox = props.tilePerBox;
    this._attributes = props.attributes;
    this._status = props.status;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
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

    const product = new Product({
      id: productId,
      sku,
      name,
      description: params.description || null,
      brand: params.brand || null,
      imageUrl: params.imageUrl || null,
      price,
      tilePerBox: params.tilePerBox,
      attributes,
      status: ProductStatus.ACTIVE,
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
        status: ProductStatus.ACTIVE.toString(),
      }),
    );

    return product;
  }

  /**
   * Reconstruct product from persistence
   */
  public static reconstruct(props: ProductProps): Product {
    return new Product(props);
  }

  // ============================================
  // Query Methods - Basic Info
  // ============================================

  public getId(): ProductId {
    return this._id;
  }

  public getSKU(): SKU {
    return this._sku;
  }

  public getName(): ProductName {
    return this._name;
  }

  public getDescription(): string | null {
    return this._description;
  }

  public getBrand(): string | null {
    return this._brand;
  }

  public getImageUrl(): string | null {
    return this._imageUrl;
  }

  public getPrice(): Price {
    return this._price;
  }

  public getTilePerBox(): number {
    return this._tilePerBox;
  }

  public getAttributes(): ProductAttributes {
    return this._attributes;
  }

  public getStatus(): ProductStatus {
    return this._status;
  }

  public getCreatedAt(): Date {
    return this._createdAt;
  }

  public getUpdatedAt(): Date {
    return this._updatedAt;
  }

  // ============================================
  // Query Methods - Status Checks
  // ============================================

  public isActive(): boolean {
    return this._status.isActive();
  }

  public isInactive(): boolean {
    return this._status.isInactive();
  }

  public isDiscontinued(): boolean {
    return this._status.isDiscontinued();
  }

  public isOutOfStock(): boolean {
    return this._status.isOutOfStock();
  }

  public isAvailableForPurchase(): boolean {
    return this.isActive();
  }

  // ============================================
  // Query Methods - Tile-Specific
  // ============================================

  public getSize(): string | undefined {
    return this._attributes.getSize();
  }

  public getGrade(): string | undefined {
    return this._attributes.getGrade();
  }

  public getFinishing(): string | undefined {
    return this._attributes.getFinishing();
  }

  public getApplicationAreas(): string[] | undefined {
    return this._attributes.getApplicationAreas();
  }

  public hasAttribute(key: string): boolean {
    return this._attributes.hasAttribute(key);
  }

  public getAttribute(key: string): unknown {
    return this._attributes.getAttribute(key);
  }

  // ============================================
  // Command Methods - Update Product Info
  // ============================================

  /**
   * Update product information
   */
  public updateInfo(params: UpdateProductParams): void {
    this.ensureNotDiscontinued();

    const changes: Record<string, boolean> = {};

    if (params.name !== undefined && params.name !== this._name.getValue()) {
      this._name = ProductName.create(params.name);
      changes.name = true;
    }

    if (
      params.description !== undefined &&
      params.description !== this._description
    ) {
      this._description = params.description;
      changes.description = true;
    }

    if (params.brand !== undefined && params.brand !== this._brand) {
      this._brand = params.brand;
      changes.brand = true;
    }

    if (params.imageUrl !== undefined && params.imageUrl !== this._imageUrl) {
      const oldImageUrl = this._imageUrl;
      this._imageUrl = params.imageUrl;
      changes.imageUrl = true;

      // Emit image updated event
      this.addDomainEvent(
        new ProductImageUpdatedEvent({
          productId: this._id.getValue(),
          sku: this._sku.getValue(),
          oldImageUrl: oldImageUrl || undefined,
          newImageUrl: params.imageUrl || undefined,
        }),
      );
    }

    if (
      params.tilePerBox !== undefined &&
      params.tilePerBox !== this._tilePerBox
    ) {
      this._tilePerBox = params.tilePerBox;
      changes.tilePerBox = true;
    }

    if (params.attributes !== undefined) {
      const newAttributes = ProductAttributes.create(params.attributes);
      if (!newAttributes.equals(this._attributes)) {
        this._attributes = newAttributes;
        changes.attributes = true;
      }
    }

    if (Object.keys(changes).length > 0) {
      this._updatedAt = new Date();

      // Emit product updated event
      this.addDomainEvent(
        new ProductUpdatedEvent({
          productId: this._id.getValue(),
          sku: this._sku.getValue(),
          changes,
        }),
      );
    }
  }

  /**
   * Update product price
   */
  public updatePrice(newPrice: number, currency?: string): void {
    this.ensureNotDiscontinued();

    const price = Price.create(newPrice, currency || this._price.getCurrency());

    if (!price.equals(this._price)) {
      const oldPrice = this._price;
      this._price = price;
      this._updatedAt = new Date();

      // Emit price changed event
      this.addDomainEvent(
        new ProductPriceChangedEvent({
          productId: this._id.getValue(),
          sku: this._sku.getValue(),
          oldPrice: oldPrice.getAmount(),
          newPrice: price.getAmount(),
          currency: price.getCurrency(),
        }),
      );

      // Emit general product updated event
      this.addDomainEvent(
        new ProductUpdatedEvent({
          productId: this._id.getValue(),
          sku: this._sku.getValue(),
          changes: { price: true },
        }),
      );
    }
  }

  /**
   * Update product image
   */
  public updateImage(imageUrl: string | null): void {
    this.ensureNotDiscontinued();

    if (imageUrl !== this._imageUrl) {
      const oldImageUrl = this._imageUrl;
      this._imageUrl = imageUrl;
      this._updatedAt = new Date();

      this.addDomainEvent(
        new ProductImageUpdatedEvent({
          productId: this._id.getValue(),
          sku: this._sku.getValue(),
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
    if (this._status.isActive()) {
      return; // Already active
    }

    const previousStatus = this._status;
    this.changeStatus(ProductStatus.ACTIVE);

    this.addDomainEvent(
      new ProductActivatedEvent({
        productId: this._id.getValue(),
        sku: this._sku.getValue(),
        previousStatus: previousStatus.toString(),
      }),
    );

    // If transitioning from OUT_OF_STOCK, emit back in stock event
    if (previousStatus.isOutOfStock()) {
      this.addDomainEvent(
        new ProductBackInStockEvent({
          productId: this._id.getValue(),
          sku: this._sku.getValue(),
          name: this._name.getValue(),
        }),
      );
    }
  }

  /**
   * Deactivate the product
   */
  public deactivate(reason?: string): void {
    if (this._status.isInactive()) {
      return; // Already inactive
    }

    this.ensureNotDiscontinued();

    const previousStatus = this._status;
    this.changeStatus(ProductStatus.INACTIVE);

    this.addDomainEvent(
      new ProductDeactivatedEvent({
        productId: this._id.getValue(),
        sku: this._sku.getValue(),
        previousStatus: previousStatus.toString(),
        reason,
      }),
    );
  }

  /**
   * Mark product as out of stock
   */
  public markAsOutOfStock(): void {
    if (this._status.isOutOfStock()) {
      return; // Already out of stock
    }

    this.ensureNotDiscontinued();

    const previousStatus = this._status;
    this.changeStatus(ProductStatus.OUT_OF_STOCK);

    this.addDomainEvent(
      new ProductOutOfStockEvent({
        productId: this._id.getValue(),
        sku: this._sku.getValue(),
        name: this._name.getValue(),
        previousStatus: previousStatus.toString(),
      }),
    );
  }

  /**
   * Discontinue the product (terminal status)
   */
  public discontinue(reason?: string): void {
    if (this._status.isDiscontinued()) {
      return; // Already discontinued
    }

    const previousStatus = this._status;
    this._status = ProductStatus.DISCONTINUED;
    this._updatedAt = new Date();

    this.addDomainEvent(
      new ProductDiscontinuedEvent({
        productId: this._id.getValue(),
        sku: this._sku.getValue(),
        name: this._name.getValue(),
        previousStatus: previousStatus.toString(),
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
        sku: this._sku.getValue(),
        name: this._name.getValue(),
      }),
    );
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  private changeStatus(newStatus: ProductStatus): void {
    if (!this._status.canTransitionTo(newStatus)) {
      throw new InvalidStatusTransitionError(
        this._status.toString(),
        newStatus.toString(),
      );
    }

    this._status = newStatus;
    this._updatedAt = new Date();
  }

  private ensureNotDiscontinued(): void {
    if (this._status.isDiscontinued()) {
      throw new ProductIsDiscontinuedError(this._id.getValue());
    }
  }
}
