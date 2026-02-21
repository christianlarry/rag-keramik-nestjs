import { DomainEvent } from 'src/core/domain/domain-event.base';

interface OrderUpdatedPayload {
  orderId: string;
  orderNumber: string;
  changes: Record<string, boolean>;
  updatedAt: Date;
}

export class OrderUpdatedEvent extends DomainEvent<OrderUpdatedPayload> {
  constructor(payload: OrderUpdatedPayload) {
    super(payload, OrderUpdatedEvent.EventName);
  }

  public static get EventName(): string {
    return 'order.updated';
  }
}
