import { DomainError } from 'src/core/domain/domain-error.base';
import { CartErrorCode } from './enums/cart-error-code.enum';

export class InvalidCartIdError extends DomainError {
  readonly code = CartErrorCode.INVALID_CART_ID;

  constructor(cartId: string) {
    super(`Invalid cart ID: ${cartId}`);
  }
}
