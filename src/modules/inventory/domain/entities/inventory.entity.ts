import { AggregateRoot } from 'src/core/domain/aggregate-root.base';
import { InventoryId } from '../value-objects/inventory-id.vo';
import { StockQuantity } from '../value-objects/stock-quantity.vo';
import {
  InsufficientStockError,
  InventoryStateConflictError,
  InvalidReservationError,
} from '../errors';
import {
  InventoryCreatedEvent,
  StockAdjustedEvent,
  StockReservedEvent,
  StockReleasedEvent,
  StockDepletedEvent,
} from '../events';

interface InventoryProps {
  productId: string;
  stock: StockQuantity;
  reserved: StockQuantity;
  readonly createdAt: Date;
  updatedAt: Date;
}

interface CreateInventoryParams {
  productId: string;
  initialStock?: number;
}

/**
 * Inventory — Aggregate Root
 *
 * Manages stock levels for a product. Each product has exactly one Inventory record.
 * Supports stock reservation during checkout to prevent overselling.
 *
 * Key invariants:
 * - Stock cannot be negative
 * - Reserved cannot exceed stock
 * - Available stock = stock - reserved
 */
export class Inventory extends AggregateRoot {
  private readonly _id: InventoryId;
  private props: InventoryProps;

  private constructor(id: InventoryId, props: InventoryProps) {
    super();
    this._id = id;
    this.props = props;
    this.validate();
  }

  private validate(): void {
    if (!this.props.productId || this.props.productId.trim().length === 0) {
      throw new InventoryStateConflictError(
        'Inventory must have a valid product ID',
      );
    }

    // Reserved cannot exceed stock
    if (this.props.reserved.getValue() > this.props.stock.getValue()) {
      throw new InventoryStateConflictError(
        'Reserved quantity cannot exceed total stock',
      );
    }

    if (
      !(this.props.createdAt instanceof Date) ||
      isNaN(this.props.createdAt.getTime())
    ) {
      throw new InventoryStateConflictError(
        'Inventory created date is invalid',
      );
    }

    if (
      !(this.props.updatedAt instanceof Date) ||
      isNaN(this.props.updatedAt.getTime())
    ) {
      throw new InventoryStateConflictError(
        'Inventory updated date is invalid',
      );
    }
  }

  // ============================================
  // Factory Methods
  // ============================================

  /**
   * Create a new inventory record for a product
   */
  public static create(params: CreateInventoryParams): Inventory {
    const inventoryId = InventoryId.create();
    const initialStock = params.initialStock ?? 0;

    const inventory = new Inventory(inventoryId, {
      productId: params.productId,
      stock: StockQuantity.create(initialStock),
      reserved: StockQuantity.zero(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    inventory.addDomainEvent(
      new InventoryCreatedEvent({
        inventoryId: inventoryId.getValue(),
        productId: params.productId,
        initialStock,
      }),
    );

    return inventory;
  }

  /**
   * Reconstruct inventory from persistence
   */
  public static reconstruct(id: string, props: InventoryProps): Inventory {
    return new Inventory(InventoryId.fromString(id), props);
  }

  // ============================================
  // Query Methods
  // ============================================

  /**
   * Get available stock (total stock minus reserved)
   */
  public getAvailableStock(): number {
    return this.props.stock.getValue() - this.props.reserved.getValue();
  }

  /**
   * Check if there is sufficient available stock
   */
  public hasAvailableStock(quantity: number): boolean {
    return this.getAvailableStock() >= quantity;
  }

  /**
   * Check if stock is depleted (zero available)
   */
  public isDepleted(): boolean {
    return this.getAvailableStock() <= 0;
  }

  /**
   * Check if there are any reservations
   */
  public hasReservations(): boolean {
    return this.props.reserved.getValue() > 0;
  }

  // ============================================
  // Command Methods
  // ============================================

  /**
   * Add stock (e.g., restocking from supplier)
   */
  public addStock(quantity: number, reason?: string): void {
    if (quantity <= 0) {
      throw new InventoryStateConflictError(
        'Stock addition quantity must be positive',
      );
    }

    const previousStock = this.props.stock.getValue();
    this.props.stock = this.props.stock.add(quantity);
    this.applyChange();

    this.addDomainEvent(
      new StockAdjustedEvent({
        inventoryId: this._id.getValue(),
        productId: this.props.productId,
        previousStock,
        newStock: this.props.stock.getValue(),
        adjustment: quantity,
        reason: reason || 'Stock added',
      }),
    );
  }

  /**
   * Remove stock (e.g., damaged, lost, manual adjustment)
   */
  public removeStock(quantity: number, reason?: string): void {
    if (quantity <= 0) {
      throw new InventoryStateConflictError(
        'Stock removal quantity must be positive',
      );
    }

    if (!this.hasAvailableStock(quantity)) {
      throw new InsufficientStockError(
        this.props.productId,
        quantity,
        this.getAvailableStock(),
      );
    }

    const previousStock = this.props.stock.getValue();
    this.props.stock = this.props.stock.subtract(quantity);
    this.applyChange();

    this.addDomainEvent(
      new StockAdjustedEvent({
        inventoryId: this._id.getValue(),
        productId: this.props.productId,
        previousStock,
        newStock: this.props.stock.getValue(),
        adjustment: -quantity,
        reason: reason || 'Stock removed',
      }),
    );

    // Check if stock is now depleted
    if (this.isDepleted()) {
      this.addDomainEvent(
        new StockDepletedEvent({
          inventoryId: this._id.getValue(),
          productId: this.props.productId,
        }),
      );
    }
  }

  /**
   * Set stock to a specific value (admin override)
   */
  public setStock(quantity: number, reason?: string): void {
    const previousStock = this.props.stock.getValue();
    const newStock = StockQuantity.create(quantity);

    // Ensure new stock is not less than reserved
    if (quantity < this.props.reserved.getValue()) {
      throw new InventoryStateConflictError(
        `Cannot set stock to ${quantity}: ${this.props.reserved.getValue()} units are currently reserved`,
      );
    }

    this.props.stock = newStock;
    this.applyChange();

    this.addDomainEvent(
      new StockAdjustedEvent({
        inventoryId: this._id.getValue(),
        productId: this.props.productId,
        previousStock,
        newStock: quantity,
        adjustment: quantity - previousStock,
        reason: reason || 'Stock set manually',
      }),
    );

    if (this.isDepleted()) {
      this.addDomainEvent(
        new StockDepletedEvent({
          inventoryId: this._id.getValue(),
          productId: this.props.productId,
        }),
      );
    }
  }

  /**
   * Reserve stock during checkout
   * Reserved stock is not available for other orders.
   */
  public reserve(quantity: number): void {
    if (quantity <= 0) {
      throw new InvalidReservationError('Reservation quantity must be positive');
    }

    if (!this.hasAvailableStock(quantity)) {
      throw new InsufficientStockError(
        this.props.productId,
        quantity,
        this.getAvailableStock(),
      );
    }

    this.props.reserved = this.props.reserved.add(quantity);
    this.applyChange();

    this.addDomainEvent(
      new StockReservedEvent({
        inventoryId: this._id.getValue(),
        productId: this.props.productId,
        quantity,
        totalReserved: this.props.reserved.getValue(),
        availableStock: this.getAvailableStock(),
      }),
    );
  }

  /**
   * Release previously reserved stock (e.g., order cancelled)
   */
  public release(quantity: number): void {
    if (quantity <= 0) {
      throw new InvalidReservationError('Release quantity must be positive');
    }

    if (quantity > this.props.reserved.getValue()) {
      throw new InvalidReservationError(
        `Cannot release ${quantity} units: only ${this.props.reserved.getValue()} units are reserved`,
      );
    }

    this.props.reserved = this.props.reserved.subtract(quantity);
    this.applyChange();

    this.addDomainEvent(
      new StockReleasedEvent({
        inventoryId: this._id.getValue(),
        productId: this.props.productId,
        quantity,
        totalReserved: this.props.reserved.getValue(),
        availableStock: this.getAvailableStock(),
      }),
    );
  }

  /**
   * Confirm reserved stock (e.g., order paid, deduct from total)
   * Decreases both stock and reserved by the given quantity.
   */
  public confirmReservation(quantity: number): void {
    if (quantity <= 0) {
      throw new InvalidReservationError(
        'Confirmation quantity must be positive',
      );
    }

    if (quantity > this.props.reserved.getValue()) {
      throw new InvalidReservationError(
        `Cannot confirm ${quantity} units: only ${this.props.reserved.getValue()} units are reserved`,
      );
    }

    this.props.stock = this.props.stock.subtract(quantity);
    this.props.reserved = this.props.reserved.subtract(quantity);
    this.applyChange();

    this.addDomainEvent(
      new StockAdjustedEvent({
        inventoryId: this._id.getValue(),
        productId: this.props.productId,
        previousStock: this.props.stock.getValue() + quantity,
        newStock: this.props.stock.getValue(),
        adjustment: -quantity,
        reason: 'Reservation confirmed (order fulfilled)',
      }),
    );

    if (this.isDepleted()) {
      this.addDomainEvent(
        new StockDepletedEvent({
          inventoryId: this._id.getValue(),
          productId: this.props.productId,
        }),
      );
    }
  }

  // ============================================
  // Private Helpers
  // ============================================

  private applyChange(): void {
    this.props.updatedAt = new Date();
  }

  // ============================================
  // Getters
  // ============================================

  public get id(): InventoryId {
    return this._id;
  }

  public get productId(): string {
    return this.props.productId;
  }

  public get stock(): StockQuantity {
    return this.props.stock;
  }

  public get reserved(): StockQuantity {
    return this.props.reserved;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
