import { DomainEvent } from 'src/core/domain/domain-event.base';

interface PaymentExpiredPayload {
  paymentId: string;
  orderId: string;
  providerRef: string;
}

export class PaymentExpiredEvent extends DomainEvent<PaymentExpiredPayload> {
  constructor(payload: PaymentExpiredPayload) {
    super(payload, PaymentExpiredEvent.EventName);
  }

  public static get EventName(): string {
    return 'payment.expired';
  }
}
