import { DomainError } from 'src/core/domain/domain-error.base';
import { CartErrorCode } from './enums/cart-error-code.enum';

export class CartIsEmptyError extends DomainError {
  readonly code = CartErrorCode.CART_IS_EMPTY;

  constructor(cartId: string) {
    super(`Cart is empty: ${cartId}`);
  }
}
