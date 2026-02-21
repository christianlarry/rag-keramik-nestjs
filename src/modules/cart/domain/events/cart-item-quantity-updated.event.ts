import { DomainEvent } from 'src/core/domain/domain-event.base';

interface CartItemQuantityUpdatedPayload {
  cartId: string;
  cartItemId: string;
  productId: string;
  oldQuantity: number;
  newQuantity: number;
}

export class CartItemQuantityUpdatedEvent extends DomainEvent<CartItemQuantityUpdatedPayload> {
  constructor(payload: CartItemQuantityUpdatedPayload) {
    super(payload, CartItemQuantityUpdatedEvent.EventName);
  }

  public static get EventName(): string {
    return 'cart.item_quantity_updated';
  }
}
