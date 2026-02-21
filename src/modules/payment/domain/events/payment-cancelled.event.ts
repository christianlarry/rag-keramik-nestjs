import { DomainEvent } from 'src/core/domain/domain-event.base';

interface PaymentCancelledPayload {
  paymentId: string;
  orderId: string;
  providerRef: string;
}

export class PaymentCancelledEvent extends DomainEvent<PaymentCancelledPayload> {
  constructor(payload: PaymentCancelledPayload) {
    super(payload, PaymentCancelledEvent.EventName);
  }

  public static get EventName(): string {
    return 'payment.cancelled';
  }
}
