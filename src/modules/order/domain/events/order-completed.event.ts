import { DomainEvent } from 'src/core/domain/domain-event.base';

interface OrderCompletedPayload {
  orderId: string;
  orderNumber: string;
  userId: string;
  total: number;
  currency: string;
}

export class OrderCompletedEvent extends DomainEvent<OrderCompletedPayload> {
  constructor(payload: OrderCompletedPayload) {
    super(payload, OrderCompletedEvent.EventName);
  }

  public static get EventName(): string {
    return 'order.completed';
  }
}
