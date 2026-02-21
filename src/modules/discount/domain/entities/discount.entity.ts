import { AggregateRoot } from 'src/core/domain/aggregate-root.base';
import { Money } from 'src/core/domain/money.vo';
import {
  DiscountApplicability,
  type DiscountApplicability as DiscountApplicabilityType,
} from '../enums/discount-applicability.enum';
import { DiscountId } from '../value-objects/discount-id.vo';
import { DiscountCode } from '../value-objects/discount-code.vo';
import { DiscountValue } from '../value-objects/discount-value.vo';
import { DiscountStatus } from '../value-objects/discount-status.vo';
import { DiscountPeriod } from '../value-objects/discount-period.vo';
import {
  DiscountExpiredError,
  DiscountInactiveError,
  DiscountUsageLimitReachedError,
  DiscountNotApplicableError,
  DiscountStateConflictError,
} from '../errors';
import { DiscountCreatedEvent } from '../events/discount-created.event';
import { DiscountUpdatedEvent } from '../events/discount-updated.event';
import { DiscountActivatedEvent } from '../events/discount-activated.event';
import { DiscountDeactivatedEvent } from '../events/discount-deactivated.event';
import { DiscountExpiredEvent } from '../events/discount-expired.event';
import { DiscountAppliedEvent } from '../events/discount-applied.event';

// ============================================================
// Props
// ============================================================

interface DiscountProps {
  code: DiscountCode;
  name: string;
  description: string | null;
  discountValue: DiscountValue;
  applicability: DiscountApplicabilityType;
  minPurchase: Money | null;
  period: DiscountPeriod;
  status: DiscountStatus;
  usageLimit: number | null;
  usageCount: number;
  perUserLimit: number | null;
  productIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface CreateDiscountProps {
  code: string;
  name: string;
  description?: string | null;
  type: string;
  value: number;
  maxDiscount?: number;
  applicability?: DiscountApplicabilityType;
  minPurchase?: number | null;
  currency?: string;
  startDate: Date;
  endDate: Date;
  usageLimit?: number | null;
  perUserLimit?: number | null;
  productIds?: string[];
}

interface ReconstructDiscountProps {
  id: string;
  code: string;
  name: string;
  description: string | null;
  type: string;
  value: number;
  maxDiscount: number | null;
  applicability: string;
  minPurchase: number | null;
  currency?: string;
  startDate: Date;
  endDate: Date;
  status: string;
  usageLimit: number | null;
  usageCount: number;
  perUserLimit: number | null;
  productIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Discount Aggregate Root
 *
 * Represents a voucher/coupon discount.
 * Manages lifecycle (activate, deactivate, expire) and usage tracking.
 */
export class Discount extends AggregateRoot {
  private readonly _id: DiscountId;
  private props: DiscountProps;

  private constructor(id: DiscountId, props: DiscountProps) {
    super();
    this._id = id;
    this.props = props;
  }

  // ============================================================
  // Factory Methods
  // ============================================================

  public static create(input: CreateDiscountProps): Discount {
    const id = DiscountId.create();
    const code = DiscountCode.create(input.code);
    const discountValue = DiscountValue.create({
      type: input.type as any,
      value: input.value,
      maxDiscount: input.maxDiscount,
    });
    const period = DiscountPeriod.create(input.startDate, input.endDate);
    const status = DiscountStatus.createActive();
    const applicability =
      input.applicability ?? DiscountApplicability.ALL_PRODUCTS;
    const currency = input.currency ?? 'IDR';

    const props: DiscountProps = {
      code,
      name: input.name,
      description: input.description ?? null,
      discountValue,
      applicability,
      minPurchase:
        input.minPurchase != null
          ? Money.create(input.minPurchase, currency)
          : null,
      period,
      status,
      usageLimit: input.usageLimit ?? null,
      usageCount: 0,
      perUserLimit: input.perUserLimit ?? null,
      productIds: input.productIds ?? [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const discount = new Discount(id, props);

    discount.addDomainEvent(
      new DiscountCreatedEvent({
        discountId: id.getValue(),
        code: code.getValue(),
        name: input.name,
        type: discountValue.getType(),
        value: discountValue.getValue(),
        applicability,
        startDate: period.getStartDate(),
        endDate: period.getEndDate(),
        status: status.getValue(),
      }),
    );

    return discount;
  }

  public static reconstruct(input: ReconstructDiscountProps): Discount {
    const id = DiscountId.fromString(input.id);
    const code = DiscountCode.create(input.code);
    const discountValue = DiscountValue.create({
      type: input.type as any,
      value: input.value,
      maxDiscount: input.maxDiscount ?? undefined,
    });
    const period = DiscountPeriod.create(input.startDate, input.endDate);
    const status = DiscountStatus.create(input.status);
    const currency = input.currency ?? 'IDR';

    const props: DiscountProps = {
      code,
      name: input.name,
      description: input.description,
      discountValue,
      applicability: input.applicability as DiscountApplicabilityType,
      minPurchase:
        input.minPurchase != null
          ? Money.create(input.minPurchase, currency)
          : null,
      period,
      status,
      usageLimit: input.usageLimit,
      usageCount: input.usageCount,
      perUserLimit: input.perUserLimit,
      productIds: input.productIds,
      createdAt: input.createdAt,
      updatedAt: input.updatedAt,
    };

    return new Discount(id, props);
  }

  // ============================================================
  // Getters
  // ============================================================

  public get id(): DiscountId {
    return this._id;
  }

  public get code(): DiscountCode {
    return this.props.code;
  }

  public get name(): string {
    return this.props.name;
  }

  public get description(): string | null {
    return this.props.description;
  }

  public get discountValue(): DiscountValue {
    return this.props.discountValue;
  }

  public get applicability(): DiscountApplicabilityType {
    return this.props.applicability;
  }

  public get minPurchase(): Money | null {
    return this.props.minPurchase;
  }

  public get period(): DiscountPeriod {
    return this.props.period;
  }

  public get status(): DiscountStatus {
    return this.props.status;
  }

  public get usageLimit(): number | null {
    return this.props.usageLimit;
  }

  public get usageCount(): number {
    return this.props.usageCount;
  }

  public get perUserLimit(): number | null {
    return this.props.perUserLimit;
  }

  public get productIds(): ReadonlyArray<string> {
    return [...this.props.productIds];
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // ============================================================
  // Query Methods
  // ============================================================

  /**
   * Check if the discount can currently be applied
   */
  public canBeApplied(now: Date = new Date()): boolean {
    return (
      this.props.status.isActive() &&
      this.props.period.isCurrentlyValid(now) &&
      !this.isUsageLimitReached()
    );
  }

  /**
   * Check if usage limit has been reached
   */
  public isUsageLimitReached(): boolean {
    if (this.props.usageLimit === null) return false;
    return this.props.usageCount >= this.props.usageLimit;
  }

  /**
   * Check if discount is applicable to a specific product
   */
  public isApplicableToProduct(productId: string): boolean {
    if (this.props.applicability === DiscountApplicability.ALL_PRODUCTS) {
      return true;
    }

    if (
      this.props.applicability === DiscountApplicability.SPECIFIC_PRODUCTS
    ) {
      return this.props.productIds.includes(productId);
    }

    // MINIMUM_PURCHASE is checked via minPurchase amount, not product-specific
    return true;
  }

  /**
   * Check if purchase amount meets minimum requirement
   */
  public meetsPurchaseMinimum(purchaseAmount: Money): boolean {
    if (this.props.minPurchase === null) return true;
    return (
      purchaseAmount.isGreaterThanOrEqual(this.props.minPurchase) ||
      purchaseAmount.equals(this.props.minPurchase)
    );
  }

  /**
   * Calculate discount amount for a given purchase
   */
  public calculateDiscount(purchaseAmount: number): number {
    return this.props.discountValue.calculateDiscount(purchaseAmount);
  }

  /**
   * Check if the discount has expired based on its period
   */
  public hasExpired(now: Date = new Date()): boolean {
    return this.props.period.hasExpired(now);
  }

  // ============================================================
  // Command Methods
  // ============================================================

  /**
   * Activate the discount
   */
  public activate(): void {
    const previousStatus = this.props.status.getValue();
    const newStatus = DiscountStatus.createActive();
    this.props.status = this.props.status.transitionTo(newStatus);
    this.applyChange();

    this.addDomainEvent(
      new DiscountActivatedEvent({
        discountId: this._id.getValue(),
        code: this.props.code.getValue(),
        previousStatus,
      }),
    );
  }

  /**
   * Deactivate the discount
   */
  public deactivate(reason?: string): void {
    const previousStatus = this.props.status.getValue();
    const newStatus = DiscountStatus.createInactive();
    this.props.status = this.props.status.transitionTo(newStatus);
    this.applyChange();

    this.addDomainEvent(
      new DiscountDeactivatedEvent({
        discountId: this._id.getValue(),
        code: this.props.code.getValue(),
        previousStatus,
        reason,
      }),
    );
  }

  /**
   * Mark the discount as expired
   */
  public markAsExpired(): void {
    if (this.props.status.isExpired()) return; // idempotent

    const newStatus = DiscountStatus.createExpired();
    this.props.status = this.props.status.transitionTo(newStatus);
    this.applyChange();

    this.addDomainEvent(
      new DiscountExpiredEvent({
        discountId: this._id.getValue(),
        code: this.props.code.getValue(),
        endDate: this.props.period.getEndDate(),
      }),
    );
  }

  /**
   * Validate and apply the discount to an order, incrementing usage count
   */
  public applyToOrder(
    orderId: string,
    purchaseAmount: number,
    currency: string,
    now: Date = new Date(),
  ): number {
    // Validate status
    if (!this.props.status.isActive()) {
      throw new DiscountInactiveError(this.props.code.getValue());
    }

    // Validate period
    if (!this.props.period.isCurrentlyValid(now)) {
      if (this.props.period.hasExpired(now)) {
        throw new DiscountExpiredError(this.props.code.getValue());
      }
      throw new DiscountStateConflictError(
        `Discount "${this.props.code.getValue()}" has not started yet`,
      );
    }

    // Validate usage limit
    if (this.isUsageLimitReached()) {
      throw new DiscountUsageLimitReachedError(this.props.code.getValue());
    }

    // Validate minimum purchase
    if (this.props.minPurchase !== null) {
      const amount = Money.create(purchaseAmount, currency);
      if (!this.meetsPurchaseMinimum(amount)) {
        throw new DiscountNotApplicableError(
          `Minimum purchase of ${this.props.minPurchase.toString()} required`,
        );
      }
    }

    // Calculate discount
    const discountAmount = this.calculateDiscount(purchaseAmount);

    // Increment usage count
    this.props.usageCount += 1;
    this.applyChange();

    this.addDomainEvent(
      new DiscountAppliedEvent({
        discountId: this._id.getValue(),
        code: this.props.code.getValue(),
        orderId,
        discountAmount,
        currency,
        usageCount: this.props.usageCount,
      }),
    );

    return discountAmount;
  }

  /**
   * Decrement usage count (e.g., when an order using this discount is cancelled)
   */
  public reverseUsage(): void {
    if (this.props.usageCount <= 0) {
      throw new DiscountStateConflictError(
        'Cannot reverse usage: usage count is already 0',
      );
    }
    this.props.usageCount -= 1;
    this.applyChange();
  }

  /**
   * Update discount info (name, description, value, period, limits, etc.)
   * Only allowed when discount is INACTIVE or ACTIVE with zero usage.
   */
  public updateInfo(input: {
    name?: string;
    description?: string | null;
    type?: string;
    value?: number;
    maxDiscount?: number | null;
    applicability?: DiscountApplicabilityType;
    minPurchase?: number | null;
    currency?: string;
    startDate?: Date;
    endDate?: Date;
    usageLimit?: number | null;
    perUserLimit?: number | null;
    productIds?: string[];
  }): void {
    if (this.props.status.isExpired()) {
      throw new DiscountStateConflictError(
        'Cannot update an expired discount',
      );
    }

    const changes: Record<string, boolean> = {};
    const currency = input.currency ?? 'IDR';

    if (input.name !== undefined && input.name !== this.props.name) {
      this.props.name = input.name;
      changes['name'] = true;
    }

    if (
      input.description !== undefined &&
      input.description !== this.props.description
    ) {
      this.props.description = input.description;
      changes['description'] = true;
    }

    if (input.type !== undefined || input.value !== undefined) {
      const newType = input.type ?? this.props.discountValue.getType();
      const newValue = input.value ?? this.props.discountValue.getValue();
      const newMaxDiscount =
        input.maxDiscount !== undefined
          ? (input.maxDiscount ?? undefined)
          : (this.props.discountValue.getMaxDiscount() ?? undefined);

      this.props.discountValue = DiscountValue.create({
        type: newType as any,
        value: newValue,
        maxDiscount: newMaxDiscount,
      });
      changes['discountValue'] = true;
    } else if (input.maxDiscount !== undefined) {
      this.props.discountValue = DiscountValue.create({
        type: this.props.discountValue.getType(),
        value: this.props.discountValue.getValue(),
        maxDiscount: input.maxDiscount ?? undefined,
      });
      changes['discountValue'] = true;
    }

    if (
      input.applicability !== undefined &&
      input.applicability !== this.props.applicability
    ) {
      this.props.applicability = input.applicability;
      changes['applicability'] = true;
    }

    if (input.minPurchase !== undefined) {
      this.props.minPurchase =
        input.minPurchase != null
          ? Money.create(input.minPurchase, currency)
          : null;
      changes['minPurchase'] = true;
    }

    if (input.startDate !== undefined || input.endDate !== undefined) {
      const newStart = input.startDate ?? this.props.period.getStartDate();
      const newEnd = input.endDate ?? this.props.period.getEndDate();
      this.props.period = DiscountPeriod.create(newStart, newEnd);
      changes['period'] = true;
    }

    if (input.usageLimit !== undefined) {
      this.props.usageLimit = input.usageLimit;
      changes['usageLimit'] = true;
    }

    if (input.perUserLimit !== undefined) {
      this.props.perUserLimit = input.perUserLimit;
      changes['perUserLimit'] = true;
    }

    if (input.productIds !== undefined) {
      this.props.productIds = [...input.productIds];
      changes['productIds'] = true;
    }

    if (Object.keys(changes).length > 0) {
      this.applyChange();

      this.addDomainEvent(
        new DiscountUpdatedEvent({
          discountId: this._id.getValue(),
          code: this.props.code.getValue(),
          changes,
          updatedAt: this.props.updatedAt,
        }),
      );
    }
  }

  // ============================================================
  // Private Helpers
  // ============================================================

  private applyChange(): void {
    this.props.updatedAt = new Date();
  }
}
