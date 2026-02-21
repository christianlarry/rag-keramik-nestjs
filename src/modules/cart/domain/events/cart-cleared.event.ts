import { DomainEvent } from 'src/core/domain/domain-event.base';

interface CartClearedPayload {
  cartId: string;
  userId: string;
  itemCount: number;
}

export class CartClearedEvent extends DomainEvent<CartClearedPayload> {
  constructor(payload: CartClearedPayload) {
    super(payload, CartClearedEvent.EventName);
  }

  public static get EventName(): string {
    return 'cart.cleared';
  }
}
