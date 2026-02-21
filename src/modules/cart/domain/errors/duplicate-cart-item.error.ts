import { DomainError } from 'src/core/domain/domain-error.base';
import { CartErrorCode } from './enums/cart-error-code.enum';

export class DuplicateCartItemError extends DomainError {
  readonly code = CartErrorCode.DUPLICATE_CART_ITEM;

  constructor(productId: string) {
    super(`Product already exists in cart: ${productId}`);
  }
}
