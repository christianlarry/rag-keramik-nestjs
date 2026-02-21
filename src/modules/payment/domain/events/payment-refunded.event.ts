import { DomainEvent } from 'src/core/domain/domain-event.base';

interface PaymentRefundedPayload {
  paymentId: string;
  orderId: string;
  providerRef: string;
  amount: number;
  currency: string;
}

export class PaymentRefundedEvent extends DomainEvent<PaymentRefundedPayload> {
  constructor(payload: PaymentRefundedPayload) {
    super(payload, PaymentRefundedEvent.EventName);
  }

  public static get EventName(): string {
    return 'payment.refunded';
  }
}
