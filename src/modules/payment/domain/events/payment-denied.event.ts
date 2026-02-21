import { DomainEvent } from 'src/core/domain/domain-event.base';

interface PaymentDeniedPayload {
  paymentId: string;
  orderId: string;
  providerRef: string;
}

export class PaymentDeniedEvent extends DomainEvent<PaymentDeniedPayload> {
  constructor(payload: PaymentDeniedPayload) {
    super(payload, PaymentDeniedEvent.EventName);
  }

  public static get EventName(): string {
    return 'payment.denied';
  }
}
