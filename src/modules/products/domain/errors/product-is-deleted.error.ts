import { DomainError } from 'src/core/domain/domain-error.base';
import { ProductErrorCode } from './enums/product-error-code.enum';

export class ProductIsDeletedError extends DomainError {
  readonly code = ProductErrorCode.PRODUCT_IS_DELETED;

  constructor(productId: string) {
    super(`Product is deleted and cannot be modified: ${productId}`);
  }
}
