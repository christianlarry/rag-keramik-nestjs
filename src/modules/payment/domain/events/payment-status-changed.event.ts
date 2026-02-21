import { DomainEvent } from 'src/core/domain/domain-event.base';

interface PaymentStatusChangedPayload {
  paymentId: string;
  orderId: string;
  providerRef: string;
  previousStatus: string;
  newStatus: string;
}

export class PaymentStatusChangedEvent extends DomainEvent<PaymentStatusChangedPayload> {
  constructor(payload: PaymentStatusChangedPayload) {
    super(payload, PaymentStatusChangedEvent.EventName);
  }

  public static get EventName(): string {
    return 'payment.status_changed';
  }
}
