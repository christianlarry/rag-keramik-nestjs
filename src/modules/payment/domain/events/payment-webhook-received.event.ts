import { DomainEvent } from 'src/core/domain/domain-event.base';

interface PaymentWebhookReceivedPayload {
  paymentId: string;
  orderId: string;
  providerRef: string;
  provider: string;
  rawPayload: Record<string, any>;
}

export class PaymentWebhookReceivedEvent extends DomainEvent<PaymentWebhookReceivedPayload> {
  constructor(payload: PaymentWebhookReceivedPayload) {
    super(payload, PaymentWebhookReceivedEvent.EventName);
  }

  public static get EventName(): string {
    return 'payment.webhook_received';
  }
}
