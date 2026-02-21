import { DomainEvent } from 'src/core/domain/domain-event.base';

interface CartCreatedPayload {
  cartId: string;
  userId: string;
}

export class CartCreatedEvent extends DomainEvent<CartCreatedPayload> {
  constructor(payload: CartCreatedPayload) {
    super(payload, CartCreatedEvent.EventName);
  }

  public static get EventName(): string {
    return 'cart.created';
  }
}
