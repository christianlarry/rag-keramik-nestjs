import { DomainError } from 'src/core/domain/domain-error.base';
import { ProductErrorCode } from './enums/product-error-code.enum';

export class InvalidProductStatusError extends DomainError {
  readonly code = ProductErrorCode.INVALID_STATUS;

  constructor(status: string) {
    super(`Invalid product status: ${status}`);
  }
}
