import { DomainError } from 'src/core/domain/domain-error.base';
import { CartErrorCode } from './enums/cart-error-code.enum';

export class CartNotFoundError extends DomainError {
  readonly code = CartErrorCode.CART_NOT_FOUND;

  constructor(identifier: string) {
    super(`Cart not found: ${identifier}`);
  }
}
