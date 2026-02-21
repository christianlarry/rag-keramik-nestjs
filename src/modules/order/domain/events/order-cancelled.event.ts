import { DomainEvent } from 'src/core/domain/domain-event.base';

interface OrderCancelledPayload {
  orderId: string;
  orderNumber: string;
  userId: string;
  previousStatus: string;
  reason?: string;
}

export class OrderCancelledEvent extends DomainEvent<OrderCancelledPayload> {
  constructor(payload: OrderCancelledPayload) {
    super(payload, OrderCancelledEvent.EventName);
  }

  public static get EventName(): string {
    return 'order.cancelled';
  }
}
