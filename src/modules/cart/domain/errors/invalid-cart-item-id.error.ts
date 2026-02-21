import { DomainError } from 'src/core/domain/domain-error.base';
import { CartErrorCode } from './enums/cart-error-code.enum';

export class InvalidCartItemIdError extends DomainError {
  readonly code = CartErrorCode.INVALID_CART_ITEM_ID;

  constructor(cartItemId: string) {
    super(`Invalid cart item ID: ${cartItemId}`);
  }
}
