import { DomainError } from 'src/core/domain/domain-error.base';
import { ProductErrorCode } from './enums/product-error-code.enum';

export class InvalidProductSizeError extends DomainError {
  readonly code = ProductErrorCode.INVALID_PRODUCT_SIZE;

  constructor(message?: string) {
    super(
      `Invalid product size: ${message ? `${message}` : ''}`,
    );
  }
}
