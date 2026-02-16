import { DomainError } from 'src/core/domain/domain-error.base';
import { ProductErrorCode } from './enums/product-error-code.enum';

export class ProductIsDiscontinuedError extends DomainError {
  readonly code = ProductErrorCode.PRODUCT_IS_DISCONTINUED;

  constructor(productId: string) {
    super(`Product is discontinued and cannot be modified: ${productId}`);
  }
}
