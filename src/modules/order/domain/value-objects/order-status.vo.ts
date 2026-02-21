import { OrderStatusEnum } from '../enums';
import { InvalidOrderStatusError } from '../errors';
import { InvalidOrderStatusTransitionError } from '../errors/invalid-order-status-transition.error';

/**
 * OrderStatus Value Object
 *
 * Encapsulates order status with state machine transition rules.
 *
 * Valid transitions:
 *   DRAFT -> PENDING_PAYMENT
 *   PENDING_PAYMENT -> PAID, CANCELLED
 *   PAID -> FULFILLMENT, CANCELLED
 *   FULFILLMENT -> COMPLETED
 *   COMPLETED -> (terminal)
 *   CANCELLED -> (terminal)
 */
export class OrderStatus {
  private readonly value: OrderStatusEnum;

  private static readonly VALID_TRANSITIONS: Record<
    OrderStatusEnum,
    OrderStatusEnum[]
  > = {
      [OrderStatusEnum.DRAFT]: [OrderStatusEnum.PENDING_PAYMENT],
      [OrderStatusEnum.PENDING_PAYMENT]: [
        OrderStatusEnum.PAID,
        OrderStatusEnum.CANCELLED,
      ],
      [OrderStatusEnum.PAID]: [
        OrderStatusEnum.FULFILLMENT,
        OrderStatusEnum.CANCELLED,
      ],
      [OrderStatusEnum.FULFILLMENT]: [OrderStatusEnum.COMPLETED],
      [OrderStatusEnum.COMPLETED]: [],
      [OrderStatusEnum.CANCELLED]: [],
    };

  private constructor(value: OrderStatusEnum) {
    this.value = value;
  }

  public static create(value: string): OrderStatus {
    const validStatuses = Object.values(OrderStatusEnum) as string[];
    if (!validStatuses.includes(value)) {
      throw new InvalidOrderStatusError(value);
    }
    return new OrderStatus(value as OrderStatusEnum);
  }

  public static createDraft(): OrderStatus {
    return new OrderStatus(OrderStatusEnum.DRAFT);
  }

  public static createPendingPayment(): OrderStatus {
    return new OrderStatus(OrderStatusEnum.PENDING_PAYMENT);
  }

  public static createPaid(): OrderStatus {
    return new OrderStatus(OrderStatusEnum.PAID);
  }

  public static createFulfillment(): OrderStatus {
    return new OrderStatus(OrderStatusEnum.FULFILLMENT);
  }

  public static createCompleted(): OrderStatus {
    return new OrderStatus(OrderStatusEnum.COMPLETED);
  }

  public static createCancelled(): OrderStatus {
    return new OrderStatus(OrderStatusEnum.CANCELLED);
  }

  public getValue(): OrderStatusEnum {
    return this.value;
  }

  public equals(other: OrderStatus): boolean {
    return this.value === other.value;
  }

  // ============================================
  // Status Checks
  // ============================================

  public isDraft(): boolean {
    return this.value === OrderStatusEnum.DRAFT;
  }

  public isPendingPayment(): boolean {
    return this.value === OrderStatusEnum.PENDING_PAYMENT;
  }

  public isPaid(): boolean {
    return this.value === OrderStatusEnum.PAID;
  }

  public isFulfillment(): boolean {
    return this.value === OrderStatusEnum.FULFILLMENT;
  }

  public isCompleted(): boolean {
    return this.value === OrderStatusEnum.COMPLETED;
  }

  public isCancelled(): boolean {
    return this.value === OrderStatusEnum.CANCELLED;
  }

  public isTerminal(): boolean {
    return this.isCompleted() || this.isCancelled();
  }

  // ============================================
  // Transition Validation
  // ============================================

  public canTransitionTo(newStatus: OrderStatus): boolean {
    const allowedTransitions = OrderStatus.VALID_TRANSITIONS[this.value];
    return allowedTransitions.includes(newStatus.value);
  }

  public transitionTo(newStatus: OrderStatus): OrderStatus {
    if (!this.canTransitionTo(newStatus)) {
      throw new InvalidOrderStatusTransitionError(this.value, newStatus.value);
    }
    return newStatus;
  }

  public toString(): string {
    return this.value;
  }
}
