import { DomainEvent } from 'src/core/domain/domain-event.base';

interface PaymentSettledPayload {
  paymentId: string;
  orderId: string;
  providerRef: string;
  amount: number;
  currency: string;
}

export class PaymentSettledEvent extends DomainEvent<PaymentSettledPayload> {
  constructor(payload: PaymentSettledPayload) {
    super(payload, PaymentSettledEvent.EventName);
  }

  public static get EventName(): string {
    return 'payment.settled';
  }
}
