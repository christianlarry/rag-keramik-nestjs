import { DomainEvent } from 'src/core/domain/domain-event.base';

interface CartItemAddedPayload {
  cartId: string;
  cartItemId: string;
  productId: string;
  quantity: number;
}

export class CartItemAddedEvent extends DomainEvent<CartItemAddedPayload> {
  constructor(payload: CartItemAddedPayload) {
    super(payload, CartItemAddedEvent.EventName);
  }

  public static get EventName(): string {
    return 'cart.item_added';
  }
}
