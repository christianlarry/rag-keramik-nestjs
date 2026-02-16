import { DomainError } from 'src/core/domain/domain-error.base';
import { ProductErrorCode } from './enums/product-error-code.enum';

export class ProductAlreadyExistsError extends DomainError {
  readonly code = ProductErrorCode.PRODUCT_ALREADY_EXISTS;

  constructor(identifier: string) {
    super(`Product already exists: ${identifier}`);
  }
}
