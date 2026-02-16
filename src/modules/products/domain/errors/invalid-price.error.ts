import { DomainError } from 'src/core/domain/domain-error.base';
import { ProductErrorCode } from './enums/product-error-code.enum';

export class InvalidPriceError extends DomainError {
  readonly code = ProductErrorCode.INVALID_PRICE;

  constructor(price: number, reason?: string) {
    super(`Invalid price: ${price}${reason ? `. ${reason}` : ''}`);
  }
}
