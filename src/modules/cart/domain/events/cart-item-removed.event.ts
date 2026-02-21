import { DomainEvent } from 'src/core/domain/domain-event.base';

interface CartItemRemovedPayload {
  cartId: string;
  cartItemId: string;
  productId: string;
}

export class CartItemRemovedEvent extends DomainEvent<CartItemRemovedPayload> {
  constructor(payload: CartItemRemovedPayload) {
    super(payload, CartItemRemovedEvent.EventName);
  }

  public static get EventName(): string {
    return 'cart.item_removed';
  }
}
