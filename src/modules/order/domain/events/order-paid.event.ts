import { DomainEvent } from 'src/core/domain/domain-event.base';

interface OrderPaidPayload {
  orderId: string;
  orderNumber: string;
  userId: string;
  total: number;
  currency: string;
}

export class OrderPaidEvent extends DomainEvent<OrderPaidPayload> {
  constructor(payload: OrderPaidPayload) {
    super(payload, OrderPaidEvent.EventName);
  }

  public static get EventName(): string {
    return 'order.paid';
  }
}
