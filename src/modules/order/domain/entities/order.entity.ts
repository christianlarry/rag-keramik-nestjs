import { AggregateRoot } from 'src/core/domain/aggregate-root.base';
import { Money } from 'src/core/domain/money.vo';
import { OrderId } from '../value-objects/order-id.vo';
import { OrderNumber } from '../value-objects/order-number.vo';
import { OrderStatus } from '../value-objects/order-status.vo';
import { OrderItem } from './order-item.entity';
import {
  OrderStateConflictError,
  OrderIsEmptyError,
  OrderCannotBeCancelledError,
  InvalidOrderStatusTransitionError,
} from '../errors';
import {
  OrderCreatedEvent,
  OrderUpdatedEvent,
  OrderStatusChangedEvent,
  OrderPaidEvent,
  OrderCancelledEvent,
  OrderCompletedEvent,
  OrderItemAddedEvent,
} from '../events';

interface OrderProps {
  orderNumber: OrderNumber;
  userId: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: Money;
  tax: Money;
  shippingCost: Money;
  discountAmount: Money;
  total: Money;
  currency: string;
  discountId: string | null;
  notes: string | null;
  readonly createdAt: Date;
  updatedAt: Date;
}

interface CreateOrderItemInput {
  productId: string;
  quantity: number;
  unitPrice: number;
  originalPrice: number;
}

interface CreateOrderParams {
  userId: string;
  items: CreateOrderItemInput[];
  tax?: number;
  shippingCost?: number;
  discountAmount?: number;
  discountId?: string;
  notes?: string;
  currency?: string;
}

/**
 * Order — Aggregate Root
 *
 * Represents a customer order in the e-commerce system.
 * Manages the complete order lifecycle from creation to completion/cancellation.
 *
 * State machine:
 *   PENDING_PAYMENT -> PAID -> FULFILLMENT -> COMPLETED
 *   PENDING_PAYMENT -> CANCELLED
 *   PAID -> CANCELLED (requires refund handling)
 *
 * Key invariants:
 *   - Order must have at least one item
 *   - Total = subtotal + tax + shippingCost - discountAmount
 *   - Status transitions follow strict rules
 *   - Completed/Cancelled orders are immutable
 */
export class Order extends AggregateRoot {
  private readonly _id: OrderId;
  private props: OrderProps;

  private constructor(id: OrderId, props: OrderProps) {
    super();
    this._id = id;
    this.props = props;
    this.validate();
  }

  private validate(): void {
    if (!this.props.userId || this.props.userId.trim().length === 0) {
      throw new OrderStateConflictError('Order must have a valid user ID');
    }

    if (
      !(this.props.createdAt instanceof Date) ||
      isNaN(this.props.createdAt.getTime())
    ) {
      throw new OrderStateConflictError('Order created date is invalid');
    }

    if (
      !(this.props.updatedAt instanceof Date) ||
      isNaN(this.props.updatedAt.getTime())
    ) {
      throw new OrderStateConflictError('Order updated date is invalid');
    }

    if (this.props.updatedAt < this.props.createdAt) {
      throw new OrderStateConflictError(
        'Updated date cannot be before created date',
      );
    }

    // Notes validation
    if (
      this.props.notes !== null &&
      this.props.notes.trim().length === 0
    ) {
      throw new OrderStateConflictError(
        'Order notes cannot be an empty string',
      );
    }
  }

  // ============================================
  // Factory Methods
  // ============================================

  /**
   * Create a new order from checkout
   */
  public static create(params: CreateOrderParams): Order {
    const orderId = OrderId.create();
    const orderNumber = OrderNumber.generate();
    const currency = params.currency || 'IDR';

    // Create order items
    const items = params.items.map((item) =>
      OrderItem.create({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        originalPrice: item.originalPrice,
        currency,
      }),
    );

    if (items.length === 0) {
      throw new OrderIsEmptyError(orderId.getValue());
    }

    // Calculate totals
    const subtotal = items.reduce(
      (sum, item) => sum.add(item.getSubtotal()),
      Money.zero(currency),
    );

    const tax = Money.create(params.tax || 0, currency);
    const shippingCost = Money.create(params.shippingCost || 0, currency);
    const discountAmount = Money.create(params.discountAmount || 0, currency);

    const total = subtotal
      .add(tax)
      .add(shippingCost)
      .subtract(discountAmount);

    const order = new Order(orderId, {
      orderNumber,
      userId: params.userId,
      status: OrderStatus.createPendingPayment(),
      items,
      subtotal,
      tax,
      shippingCost,
      discountAmount,
      total,
      currency,
      discountId: params.discountId || null,
      notes: params.notes || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    order.addDomainEvent(
      new OrderCreatedEvent({
        orderId: orderId.getValue(),
        orderNumber: orderNumber.getValue(),
        userId: params.userId,
        status: order.props.status.getValue(),
        subtotal: subtotal.getAmount(),
        tax: tax.getAmount(),
        shippingCost: shippingCost.getAmount(),
        discountAmount: discountAmount.getAmount(),
        total: total.getAmount(),
        currency,
        itemCount: items.length,
      }),
    );

    return order;
  }

  /**
   * Reconstruct order from persistence
   */
  public static reconstruct(id: string, props: OrderProps): Order {
    return new Order(OrderId.fromString(id), props);
  }

  // ============================================
  // Query Methods — Status Checks
  // ============================================

  public isPendingPayment(): boolean {
    return this.props.status.isPendingPayment();
  }

  public isPaid(): boolean {
    return this.props.status.isPaid();
  }

  public isFulfillment(): boolean {
    return this.props.status.isFulfillment();
  }

  public isCompleted(): boolean {
    return this.props.status.isCompleted();
  }

  public isCancelled(): boolean {
    return this.props.status.isCancelled();
  }

  public isTerminal(): boolean {
    return this.props.status.isTerminal();
  }

  // ============================================
  // Query Methods — Capability Checks
  // ============================================

  public canBePaid(): boolean {
    return this.props.status.isPendingPayment();
  }

  public canBeCancelled(): boolean {
    return (
      this.props.status.isPendingPayment() || this.props.status.isPaid()
    );
  }

  public canBeModified(): boolean {
    return !this.isTerminal();
  }

  public canStartFulfillment(): boolean {
    return this.props.status.isPaid();
  }

  public canBeCompleted(): boolean {
    return this.props.status.isFulfillment();
  }

  /**
   * Whether cancellation requires a refund
   */
  public requiresRefundOnCancellation(): boolean {
    return this.props.status.isPaid();
  }

  // ============================================
  // Ensure Invariants
  // ============================================

  private ensureNotTerminal(): void {
    if (this.isTerminal()) {
      throw new OrderStateConflictError(
        `Order ${this._id.getValue()} is in terminal status: ${this.props.status.getValue()}`,
      );
    }
  }

  // ============================================
  // Command Methods — Status Transitions
  // ============================================

  /**
   * Mark order as paid (called after payment confirmation)
   */
  public markAsPaid(): void {
    if (this.props.status.isPaid()) {
      return; // Idempotent
    }

    const previousStatus = this.props.status;
    this.changeStatus(OrderStatus.createPaid());
    this.applyChange();

    this.addDomainEvent(
      new OrderPaidEvent({
        orderId: this._id.getValue(),
        orderNumber: this.props.orderNumber.getValue(),
        userId: this.props.userId,
        total: this.props.total.getAmount(),
        currency: this.props.currency,
      }),
    );

    this.addDomainEvent(
      new OrderStatusChangedEvent({
        orderId: this._id.getValue(),
        orderNumber: this.props.orderNumber.getValue(),
        previousStatus: previousStatus.getValue(),
        newStatus: this.props.status.getValue(),
      }),
    );
  }

  /**
   * Start order fulfillment (shipping/delivery)
   */
  public startFulfillment(): void {
    if (this.props.status.isFulfillment()) {
      return; // Idempotent
    }

    const previousStatus = this.props.status;
    this.changeStatus(OrderStatus.createFulfillment());
    this.applyChange();

    this.addDomainEvent(
      new OrderStatusChangedEvent({
        orderId: this._id.getValue(),
        orderNumber: this.props.orderNumber.getValue(),
        previousStatus: previousStatus.getValue(),
        newStatus: this.props.status.getValue(),
      }),
    );
  }

  /**
   * Mark order as completed (delivered)
   */
  public complete(): void {
    if (this.props.status.isCompleted()) {
      return; // Idempotent
    }

    const previousStatus = this.props.status;
    this.changeStatus(OrderStatus.createCompleted());
    this.applyChange();

    this.addDomainEvent(
      new OrderCompletedEvent({
        orderId: this._id.getValue(),
        orderNumber: this.props.orderNumber.getValue(),
        userId: this.props.userId,
        total: this.props.total.getAmount(),
        currency: this.props.currency,
      }),
    );

    this.addDomainEvent(
      new OrderStatusChangedEvent({
        orderId: this._id.getValue(),
        orderNumber: this.props.orderNumber.getValue(),
        previousStatus: previousStatus.getValue(),
        newStatus: this.props.status.getValue(),
      }),
    );
  }

  /**
   * Cancel the order
   */
  public cancel(reason?: string): void {
    if (this.props.status.isCancelled()) {
      return; // Idempotent
    }

    if (!this.canBeCancelled()) {
      throw new OrderCannotBeCancelledError(
        this._id.getValue(),
        this.props.status.getValue(),
      );
    }

    const previousStatus = this.props.status;
    this.props.status = OrderStatus.createCancelled();
    this.applyChange();

    this.addDomainEvent(
      new OrderCancelledEvent({
        orderId: this._id.getValue(),
        orderNumber: this.props.orderNumber.getValue(),
        userId: this.props.userId,
        previousStatus: previousStatus.getValue(),
        reason,
      }),
    );

    this.addDomainEvent(
      new OrderStatusChangedEvent({
        orderId: this._id.getValue(),
        orderNumber: this.props.orderNumber.getValue(),
        previousStatus: previousStatus.getValue(),
        newStatus: this.props.status.getValue(),
      }),
    );
  }

  // ============================================
  // Command Methods — Update Order Info
  // ============================================

  /**
   * Update order notes
   */
  public updateNotes(notes: string | null): void {
    this.ensureNotTerminal();

    if (notes !== this.props.notes) {
      this.props.notes = notes;
      this.applyChange();
    }
  }

  /**
   * Apply discount to order
   */
  public applyDiscount(discountId: string, discountAmount: number): void {
    this.ensureNotTerminal();

    this.props.discountId = discountId;
    this.props.discountAmount = Money.create(discountAmount, this.props.currency);
    this.recalculateTotal();
    this.applyChange();
  }

  /**
   * Remove discount from order
   */
  public removeDiscount(): void {
    this.ensureNotTerminal();

    this.props.discountId = null;
    this.props.discountAmount = Money.zero(this.props.currency);
    this.recalculateTotal();
    this.applyChange();
  }

  // ============================================
  // Private Helpers
  // ============================================

  private changeStatus(newStatus: OrderStatus): void {
    if (!this.props.status.canTransitionTo(newStatus)) {
      throw new InvalidOrderStatusTransitionError(
        this.props.status.getValue(),
        newStatus.getValue(),
      );
    }
    this.props.status = newStatus;
  }

  private recalculateTotal(): void {
    this.props.total = this.props.subtotal
      .add(this.props.tax)
      .add(this.props.shippingCost)
      .subtract(this.props.discountAmount);
  }

  private applyChange(): void {
    this.props.updatedAt = new Date();
  }

  // ============================================
  // Getters
  // ============================================

  public get id(): OrderId {
    return this._id;
  }

  public get orderNumber(): OrderNumber {
    return this.props.orderNumber;
  }

  public get userId(): string {
    return this.props.userId;
  }

  public get status(): OrderStatus {
    return this.props.status;
  }

  public get items(): ReadonlyArray<OrderItem> {
    return [...this.props.items];
  }

  public get subtotal(): Money {
    return this.props.subtotal;
  }

  public get tax(): Money {
    return this.props.tax;
  }

  public get shippingCost(): Money {
    return this.props.shippingCost;
  }

  public get discountAmount(): Money {
    return this.props.discountAmount;
  }

  public get total(): Money {
    return this.props.total;
  }

  public get currency(): string {
    return this.props.currency;
  }

  public get discountId(): string | null {
    return this.props.discountId;
  }

  public get notes(): string | null {
    return this.props.notes;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
