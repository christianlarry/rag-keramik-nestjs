import { DomainEvent } from 'src/core/domain/domain-event.base';

interface OrderStatusChangedPayload {
  orderId: string;
  orderNumber: string;
  previousStatus: string;
  newStatus: string;
}

export class OrderStatusChangedEvent extends DomainEvent<OrderStatusChangedPayload> {
  constructor(payload: OrderStatusChangedPayload) {
    super(payload, OrderStatusChangedEvent.EventName);
  }

  public static get EventName(): string {
    return 'order.status_changed';
  }
}
