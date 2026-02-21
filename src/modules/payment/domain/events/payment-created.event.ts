import { DomainEvent } from 'src/core/domain/domain-event.base';

interface PaymentCreatedPayload {
  paymentId: string;
  orderId: string;
  provider: string;
  providerRef: string;
  amount: number;
  currency: string;
  status: string;
}

export class PaymentCreatedEvent extends DomainEvent<PaymentCreatedPayload> {
  constructor(payload: PaymentCreatedPayload) {
    super(payload, PaymentCreatedEvent.EventName);
  }

  public static get EventName(): string {
    return 'payment.created';
  }
}
