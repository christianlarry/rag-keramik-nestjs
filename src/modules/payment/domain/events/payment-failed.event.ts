import { DomainEvent } from 'src/core/domain/domain-event.base';

interface PaymentFailedPayload {
  paymentId: string;
  orderId: string;
  providerRef: string;
  reason?: string;
}

export class PaymentFailedEvent extends DomainEvent<PaymentFailedPayload> {
  constructor(payload: PaymentFailedPayload) {
    super(payload, PaymentFailedEvent.EventName);
  }

  public static get EventName(): string {
    return 'payment.failed';
  }
}
