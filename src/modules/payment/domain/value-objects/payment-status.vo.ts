import { PaymentStatusEnum } from '../enums/payment-status.enum';
import { InvalidPaymentStatusError } from '../errors/invalid-payment-status.error';
import { InvalidPaymentStatusTransitionError } from '../errors/invalid-payment-status-transition.error';

/**
 * PaymentStatus Value Object
 *
 * Encapsulates payment status with Midtrans-aligned state transitions.
 *
 * Valid transitions:
 *   INITIATED -> PENDING, FAILED
 *   PENDING   -> SETTLEMENT, CANCEL, EXPIRE, DENY, FAILED
 *   SETTLEMENT -> REFUND
 *   CANCEL    -> (terminal)
 *   EXPIRE    -> (terminal)
 *   DENY      -> (terminal)
 *   REFUND    -> (terminal)
 *   FAILED    -> (terminal)
 */
export class PaymentStatus {
  private readonly value: PaymentStatusEnum;

  private static readonly VALID_TRANSITIONS: Record<
    PaymentStatusEnum,
    PaymentStatusEnum[]
  > = {
      [PaymentStatusEnum.INITIATED]: [
        PaymentStatusEnum.PENDING,
        PaymentStatusEnum.FAILED,
      ],
      [PaymentStatusEnum.PENDING]: [
        PaymentStatusEnum.SETTLEMENT,
        PaymentStatusEnum.CANCEL,
        PaymentStatusEnum.EXPIRE,
        PaymentStatusEnum.DENY,
        PaymentStatusEnum.FAILED,
      ],
      [PaymentStatusEnum.SETTLEMENT]: [PaymentStatusEnum.REFUND],
      [PaymentStatusEnum.CANCEL]: [],
      [PaymentStatusEnum.EXPIRE]: [],
      [PaymentStatusEnum.DENY]: [],
      [PaymentStatusEnum.REFUND]: [],
      [PaymentStatusEnum.FAILED]: [],
    };

  private constructor(value: PaymentStatusEnum) {
    this.value = value;
  }

  public static create(value: string): PaymentStatus {
    const validStatuses = Object.values(PaymentStatusEnum) as string[];
    if (!validStatuses.includes(value)) {
      throw new InvalidPaymentStatusError(value);
    }
    return new PaymentStatus(value as PaymentStatusEnum);
  }

  public static createInitiated(): PaymentStatus {
    return new PaymentStatus(PaymentStatusEnum.INITIATED);
  }

  public getValue(): PaymentStatusEnum {
    return this.value;
  }

  public equals(other: PaymentStatus): boolean {
    return this.value === other.value;
  }

  public canTransitionTo(newStatus: PaymentStatus): boolean {
    const allowedTransitions = PaymentStatus.VALID_TRANSITIONS[this.value];
    return allowedTransitions.includes(newStatus.value);
  }

  public transitionTo(newStatus: PaymentStatus): PaymentStatus {
    if (!this.canTransitionTo(newStatus)) {
      throw new InvalidPaymentStatusTransitionError(
        this.value,
        newStatus.value,
      );
    }
    return newStatus;
  }

  // Status check helpers
  public isInitiated(): boolean {
    return this.value === PaymentStatusEnum.INITIATED;
  }

  public isPending(): boolean {
    return this.value === PaymentStatusEnum.PENDING;
  }

  public isSettled(): boolean {
    return this.value === PaymentStatusEnum.SETTLEMENT;
  }

  public isCancelled(): boolean {
    return this.value === PaymentStatusEnum.CANCEL;
  }

  public isExpired(): boolean {
    return this.value === PaymentStatusEnum.EXPIRE;
  }

  public isDenied(): boolean {
    return this.value === PaymentStatusEnum.DENY;
  }

  public isRefunded(): boolean {
    return this.value === PaymentStatusEnum.REFUND;
  }

  public isFailed(): boolean {
    return this.value === PaymentStatusEnum.FAILED;
  }

  /**
   * Check if this is a terminal (final) status
   */
  public isTerminal(): boolean {
    const terminalStatuses: PaymentStatusEnum[] = [
      PaymentStatusEnum.CANCEL,
      PaymentStatusEnum.EXPIRE,
      PaymentStatusEnum.DENY,
      PaymentStatusEnum.REFUND,
      PaymentStatusEnum.FAILED,
    ];
    return terminalStatuses.includes(this.value);
  }

  /**
   * Check if the payment was successful (settled or refunded)
   */
  public isSuccessful(): boolean {
    return this.value === PaymentStatusEnum.SETTLEMENT;
  }

  public toString(): string {
    return this.value;
  }
}
