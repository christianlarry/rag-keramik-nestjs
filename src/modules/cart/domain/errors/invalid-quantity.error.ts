import { DomainError } from 'src/core/domain/domain-error.base';
import { CartErrorCode } from './enums/cart-error-code.enum';

export class InvalidQuantityError extends DomainError {
  readonly code = CartErrorCode.INVALID_QUANTITY;

  constructor(quantity: number, reason?: string) {
    super(`Invalid quantity: ${quantity}${reason ? `. ${reason}` : ''}`);
  }
}
