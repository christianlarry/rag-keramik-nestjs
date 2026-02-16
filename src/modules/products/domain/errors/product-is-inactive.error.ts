import { DomainError } from 'src/core/domain/domain-error.base';
import { ProductErrorCode } from './enums/product-error-code.enum';

export class ProductIsInactiveError extends DomainError {
  readonly code = ProductErrorCode.PRODUCT_IS_INACTIVE;

  constructor(productId: string) {
    super(`Product is inactive: ${productId}`);
  }
}
