import { AggregateRoot } from 'src/core/domain/aggregate-root.base';
import { Money } from 'src/core/domain/money.vo';
import {
  PaymentProvider,
  type PaymentProvider as PaymentProviderType,
} from '../enums/payment-provider.enum';
import { PaymentStatusEnum } from '../enums/payment-status.enum';
import { PaymentId } from '../value-objects/payment-id.vo';
import { PaymentStatus } from '../value-objects/payment-status.vo';
import { ProviderRef } from '../value-objects/provider-ref.vo';
import { PaymentStateConflictError } from '../errors/payment-state-conflict.error';
import { PaymentCreatedEvent } from '../events/payment-created.event';
import { PaymentStatusChangedEvent } from '../events/payment-status-changed.event';
import { PaymentSettledEvent } from '../events/payment-settled.event';
import { PaymentCancelledEvent } from '../events/payment-cancelled.event';
import { PaymentExpiredEvent } from '../events/payment-expired.event';
import { PaymentDeniedEvent } from '../events/payment-denied.event';
import { PaymentRefundedEvent } from '../events/payment-refunded.event';
import { PaymentFailedEvent } from '../events/payment-failed.event';
import { PaymentWebhookReceivedEvent } from '../events/payment-webhook-received.event';

// ============================================================
// Props
// ============================================================

interface PaymentProps {
  orderId: string;
  provider: PaymentProviderType;
  providerRef: ProviderRef;
  status: PaymentStatus;
  amount: Money;
  currency: string;
  rawWebhookPayload: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
}

interface CreatePaymentProps {
  orderId: string;
  providerRef: string;
  amount: number;
  currency?: string;
  provider?: PaymentProviderType;
}

interface ReconstructPaymentProps {
  id: string;
  orderId: string;
  provider: string;
  providerRef: string;
  status: string;
  amount: number;
  currency: string;
  rawWebhookPayload: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Payment Aggregate Root
 *
 * Represents a payment transaction linked to an order.
 * Manages Midtrans payment lifecycle with idempotent status transitions.
 */
export class Payment extends AggregateRoot {
  private readonly _id: PaymentId;
  private props: PaymentProps;

  private constructor(id: PaymentId, props: PaymentProps) {
    super();
    this._id = id;
    this.props = props;
  }

  // ============================================================
  // Factory Methods
  // ============================================================

  public static create(input: CreatePaymentProps): Payment {
    const id = PaymentId.generate();
    const providerRef = ProviderRef.create(input.providerRef);
    const currency = input.currency ?? 'IDR';
    const provider = input.provider ?? PaymentProvider.MIDTRANS;
    const amount = Money.create(input.amount, currency);
    const status = PaymentStatus.createInitiated();

    const props: PaymentProps = {
      orderId: input.orderId,
      provider,
      providerRef,
      status,
      amount,
      currency,
      rawWebhookPayload: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const payment = new Payment(id, props);

    payment.addDomainEvent(
      new PaymentCreatedEvent({
        paymentId: id.getValue(),
        orderId: input.orderId,
        provider,
        providerRef: providerRef.getValue(),
        amount: amount.getAmount(),
        currency,
        status: status.getValue(),
      }),
    );

    return payment;
  }

  public static reconstruct(input: ReconstructPaymentProps): Payment {
    const id = PaymentId.fromString(input.id);
    const providerRef = ProviderRef.create(input.providerRef);
    const status = PaymentStatus.create(input.status);
    const amount = Money.create(input.amount, input.currency);

    const props: PaymentProps = {
      orderId: input.orderId,
      provider: input.provider as PaymentProviderType,
      providerRef,
      status,
      amount,
      currency: input.currency,
      rawWebhookPayload: input.rawWebhookPayload,
      createdAt: input.createdAt,
      updatedAt: input.updatedAt,
    };

    return new Payment(id, props);
  }

  // ============================================================
  // Getters
  // ============================================================

  public get id(): PaymentId {
    return this._id;
  }

  public get orderId(): string {
    return this.props.orderId;
  }

  public get provider(): PaymentProviderType {
    return this.props.provider;
  }

  public get providerRef(): ProviderRef {
    return this.props.providerRef;
  }

  public get status(): PaymentStatus {
    return this.props.status;
  }

  public get amount(): Money {
    return this.props.amount;
  }

  public get currency(): string {
    return this.props.currency;
  }

  public get rawWebhookPayload(): Record<string, any> | null {
    return this.props.rawWebhookPayload;
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

  public isTerminal(): boolean {
    return this.props.status.isTerminal();
  }

  public isSuccessful(): boolean {
    return this.props.status.isSuccessful();
  }

  // ============================================================
  // Command Methods
  // ============================================================

  /**
   * Mark payment as pending (waiting for user action / payment gateway)
   */
  public markAsPending(): void {
    if (this.props.status.isPending()) return; // idempotent

    this.transitionStatus(PaymentStatusEnum.PENDING);
  }

  /**
   * Mark payment as settled (successful payment)
   */
  public markAsSettled(webhookPayload?: Record<string, any>): void {
    if (this.props.status.isSettled()) return; // idempotent

    this.transitionStatus(PaymentStatusEnum.SETTLEMENT);
    if (webhookPayload) {
      this.props.rawWebhookPayload = webhookPayload;
    }

    this.addDomainEvent(
      new PaymentSettledEvent({
        paymentId: this._id.getValue(),
        orderId: this.props.orderId,
        providerRef: this.props.providerRef.getValue(),
        amount: this.props.amount.getAmount(),
        currency: this.props.currency,
      }),
    );
  }

  /**
   * Mark payment as cancelled
   */
  public markAsCancelled(webhookPayload?: Record<string, any>): void {
    if (this.props.status.isCancelled()) return; // idempotent

    this.transitionStatus(PaymentStatusEnum.CANCEL);
    if (webhookPayload) {
      this.props.rawWebhookPayload = webhookPayload;
    }

    this.addDomainEvent(
      new PaymentCancelledEvent({
        paymentId: this._id.getValue(),
        orderId: this.props.orderId,
        providerRef: this.props.providerRef.getValue(),
      }),
    );
  }

  /**
   * Mark payment as expired
   */
  public markAsExpired(webhookPayload?: Record<string, any>): void {
    if (this.props.status.isExpired()) return; // idempotent

    this.transitionStatus(PaymentStatusEnum.EXPIRE);
    if (webhookPayload) {
      this.props.rawWebhookPayload = webhookPayload;
    }

    this.addDomainEvent(
      new PaymentExpiredEvent({
        paymentId: this._id.getValue(),
        orderId: this.props.orderId,
        providerRef: this.props.providerRef.getValue(),
      }),
    );
  }

  /**
   * Mark payment as denied
   */
  public markAsDenied(webhookPayload?: Record<string, any>): void {
    if (this.props.status.isDenied()) return; // idempotent

    this.transitionStatus(PaymentStatusEnum.DENY);
    if (webhookPayload) {
      this.props.rawWebhookPayload = webhookPayload;
    }

    this.addDomainEvent(
      new PaymentDeniedEvent({
        paymentId: this._id.getValue(),
        orderId: this.props.orderId,
        providerRef: this.props.providerRef.getValue(),
      }),
    );
  }

  /**
   * Mark payment as refunded
   */
  public markAsRefunded(webhookPayload?: Record<string, any>): void {
    if (this.props.status.isRefunded()) return; // idempotent

    this.transitionStatus(PaymentStatusEnum.REFUND);
    if (webhookPayload) {
      this.props.rawWebhookPayload = webhookPayload;
    }

    this.addDomainEvent(
      new PaymentRefundedEvent({
        paymentId: this._id.getValue(),
        orderId: this.props.orderId,
        providerRef: this.props.providerRef.getValue(),
        amount: this.props.amount.getAmount(),
        currency: this.props.currency,
      }),
    );
  }

  /**
   * Mark payment as failed
   */
  public markAsFailed(
    reason?: string,
    webhookPayload?: Record<string, any>,
  ): void {
    if (this.props.status.isFailed()) return; // idempotent

    this.transitionStatus(PaymentStatusEnum.FAILED);
    if (webhookPayload) {
      this.props.rawWebhookPayload = webhookPayload;
    }

    this.addDomainEvent(
      new PaymentFailedEvent({
        paymentId: this._id.getValue(),
        orderId: this.props.orderId,
        providerRef: this.props.providerRef.getValue(),
        reason,
      }),
    );
  }

  /**
   * Process a webhook notification from the payment provider.
   * Updates status based on the webhook payload and stores the raw payload.
   */
  public processWebhook(
    newStatus: string,
    rawPayload: Record<string, any>,
  ): void {
    this.addDomainEvent(
      new PaymentWebhookReceivedEvent({
        paymentId: this._id.getValue(),
        orderId: this.props.orderId,
        providerRef: this.props.providerRef.getValue(),
        provider: this.props.provider,
        rawPayload,
      }),
    );

    this.props.rawWebhookPayload = rawPayload;

    // Map provider status to domain status and apply
    const mappedStatus = this.mapProviderStatus(newStatus);

    switch (mappedStatus) {
      case PaymentStatusEnum.PENDING:
        this.markAsPending();
        break;
      case PaymentStatusEnum.SETTLEMENT:
        this.markAsSettled(rawPayload);
        break;
      case PaymentStatusEnum.CANCEL:
        this.markAsCancelled(rawPayload);
        break;
      case PaymentStatusEnum.EXPIRE:
        this.markAsExpired(rawPayload);
        break;
      case PaymentStatusEnum.DENY:
        this.markAsDenied(rawPayload);
        break;
      case PaymentStatusEnum.REFUND:
        this.markAsRefunded(rawPayload);
        break;
      case PaymentStatusEnum.FAILED:
        this.markAsFailed('Webhook reported failure', rawPayload);
        break;
      default:
        throw new PaymentStateConflictError(
          `Unknown provider status: "${newStatus}"`,
        );
    }
  }

  // ============================================================
  // Private Helpers
  // ============================================================

  private transitionStatus(newStatusValue: PaymentStatusEnum): void {
    const previousStatus = this.props.status.getValue();
    const newStatus = PaymentStatus.create(newStatusValue);
    this.props.status = this.props.status.transitionTo(newStatus);
    this.applyChange();

    this.addDomainEvent(
      new PaymentStatusChangedEvent({
        paymentId: this._id.getValue(),
        orderId: this.props.orderId,
        providerRef: this.props.providerRef.getValue(),
        previousStatus,
        newStatus: newStatusValue,
      }),
    );
  }

  /**
   * Map Midtrans transaction_status to domain PaymentStatusEnum
   */
  private mapProviderStatus(providerStatus: string): PaymentStatusEnum {
    const statusMap: Record<string, PaymentStatusEnum> = {
      // Midtrans statuses
      pending: PaymentStatusEnum.PENDING,
      capture: PaymentStatusEnum.SETTLEMENT,
      settlement: PaymentStatusEnum.SETTLEMENT,
      cancel: PaymentStatusEnum.CANCEL,
      expire: PaymentStatusEnum.EXPIRE,
      deny: PaymentStatusEnum.DENY,
      refund: PaymentStatusEnum.REFUND,
      partial_refund: PaymentStatusEnum.REFUND,
      failure: PaymentStatusEnum.FAILED,
      // Direct domain status mapping (uppercase)
      PENDING: PaymentStatusEnum.PENDING,
      SETTLEMENT: PaymentStatusEnum.SETTLEMENT,
      CANCEL: PaymentStatusEnum.CANCEL,
      EXPIRE: PaymentStatusEnum.EXPIRE,
      DENY: PaymentStatusEnum.DENY,
      REFUND: PaymentStatusEnum.REFUND,
      FAILED: PaymentStatusEnum.FAILED,
    };

    const mapped = statusMap[providerStatus];
    if (!mapped) {
      throw new PaymentStateConflictError(
        `Cannot map provider status "${providerStatus}" to domain status`,
      );
    }
    return mapped;
  }

  private applyChange(): void {
    this.props.updatedAt = new Date();
  }
}
