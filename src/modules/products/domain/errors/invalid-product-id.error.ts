import { DomainError } from 'src/core/domain/domain-error.base';
import { ProductErrorCode } from './enums/product-error-code.enum';

export class InvalidProductIdError extends DomainError {
  readonly code = ProductErrorCode.INVALID_PRODUCT_ID;

  constructor(productId: string) {
    super(`Invalid product ID: ${productId}`);
  }
}
