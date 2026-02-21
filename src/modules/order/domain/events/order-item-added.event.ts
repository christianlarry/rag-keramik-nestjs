import { DomainEvent } from 'src/core/domain/domain-event.base';

interface OrderItemAddedPayload {
  orderId: string;
  orderItemId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  currency: string;
}

export class OrderItemAddedEvent extends DomainEvent<OrderItemAddedPayload> {
  constructor(payload: OrderItemAddedPayload) {
    super(payload, OrderItemAddedEvent.EventName);
  }

  public static get EventName(): string {
    return 'order.item_added';
  }
}
