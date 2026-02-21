import { DomainError } from 'src/core/domain/domain-error.base';
import { CartErrorCode } from './enums/cart-error-code.enum';

export class CartItemNotFoundError extends DomainError {
  readonly code = CartErrorCode.CART_ITEM_NOT_FOUND;

  constructor(cartItemId: string) {
    super(`Cart item not found: ${cartItemId}`);
  }
}
