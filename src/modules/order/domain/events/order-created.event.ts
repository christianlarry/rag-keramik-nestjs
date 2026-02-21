import { DomainEvent } from 'src/core/domain/domain-event.base';

interface OrderCreatedPayload {
  orderId: string;
  orderNumber: string;
  userId: string;
  status: string;
  subtotal: number;
  tax: number;
  shippingCost: number;
  discountAmount: number;
  total: number;
  currency: string;
  itemCount: number;
}

export class OrderCreatedEvent extends DomainEvent<OrderCreatedPayload> {
  constructor(payload: OrderCreatedPayload) {
    super(payload, OrderCreatedEvent.EventName);
  }

  public static get EventName(): string {
    return 'order.created';
  }
}
