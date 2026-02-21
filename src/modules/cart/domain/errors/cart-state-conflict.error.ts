import { DomainError } from 'src/core/domain/domain-error.base';
import { CartErrorCode } from './enums/cart-error-code.enum';

export class CartStateConflictError extends DomainError {
  readonly code = CartErrorCode.STATE_CONFLICT;

  constructor(message: string = 'Cart state conflict error') {
    super(message);
  }
}
