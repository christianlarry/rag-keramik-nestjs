import { Money } from 'src/core/domain/money.vo';
import { OrderItemId } from '../value-objects/order-item-id.vo';

interface OrderItemProps {
  productId: string;
  quantity: number;
  unitPrice: Money;
  originalPrice: Money;
  readonly createdAt: Date;
  updatedAt: Date;
}

interface CreateOrderItemParams {
  productId: string;
  quantity: number;
  unitPrice: number;
  originalPrice: number;
  currency?: string;
}

/**
 * OrderItem — Child Entity of Order Aggregate
 *
 * Represents a line item in an order with pricing information.
 * Once created, order items are immutable (price snapshot at order time).
 */
export class OrderItem {
  private readonly _id: OrderItemId;
  private readonly props: OrderItemProps;

  private constructor(id: OrderItemId, props: OrderItemProps) {
    this._id = id;
    this.props = props;
    this.validate();
  }

  private validate(): void {
    if (!this.props.productId || this.props.productId.trim().length === 0) {
      throw new Error('Order item must have a valid product ID');
    }

    if (!Number.isInteger(this.props.quantity) || this.props.quantity <= 0) {
      throw new Error('Order item quantity must be a positive integer');
    }
  }

  // ============================================
  // Factory Methods
  // ============================================

  /**
   * Create a new order item
   */
  public static create(params: CreateOrderItemParams): OrderItem {
    const orderItemId = OrderItemId.create();
    const currency = params.currency || 'IDR';

    return new OrderItem(orderItemId, {
      productId: params.productId,
      quantity: params.quantity,
      unitPrice: Money.create(params.unitPrice, currency),
      originalPrice: Money.create(params.originalPrice, currency),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Reconstruct from persistence
   */
  public static reconstruct(id: string, props: OrderItemProps): OrderItem {
    return new OrderItem(OrderItemId.fromString(id), props);
  }

  // ============================================
  // Query Methods
  // ============================================

  /**
   * Get subtotal for this line item (unitPrice * quantity)
   */
  public getSubtotal(): Money {
    return this.props.unitPrice.multiply(this.props.quantity);
  }

  /**
   * Get the discount amount per unit (originalPrice - unitPrice)
   */
  public getDiscountPerUnit(): Money {
    return this.props.originalPrice.subtract(this.props.unitPrice);
  }

  /**
   * Get total discount for this line item
   */
  public getTotalDiscount(): Money {
    return this.getDiscountPerUnit().multiply(this.props.quantity);
  }

  /**
   * Check if this item has a discount
   */
  public hasDiscount(): boolean {
    return this.props.originalPrice.isGreaterThan(this.props.unitPrice);
  }

  public isForProduct(productId: string): boolean {
    return this.props.productId === productId;
  }

  // ============================================
  // Getters
  // ============================================

  public get id(): OrderItemId {
    return this._id;
  }

  public get productId(): string {
    return this.props.productId;
  }

  public get quantity(): number {
    return this.props.quantity;
  }

  public get unitPrice(): Money {
    return this.props.unitPrice;
  }

  public get originalPrice(): Money {
    return this.props.originalPrice;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
