import { DomainError } from 'src/core/domain/domain-error.base';
import { ProductErrorCode } from './enums/product-error-code.enum';

export class ProductNotFoundError extends DomainError {
  readonly code = ProductErrorCode.PRODUCT_NOT_FOUND;

  constructor(identifier: string) {
    super(`Product not found: ${identifier}`);
  }
}
