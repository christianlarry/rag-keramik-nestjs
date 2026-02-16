import { DomainError } from 'src/core/domain/domain-error.base';
import { ProductErrorCode } from './enums/product-error-code.enum';

export class InvalidProductNameError extends DomainError {
  readonly code = ProductErrorCode.INVALID_NAME;

  constructor(name: string, reason?: string) {
    super(`Invalid product name: ${name}${reason ? `. ${reason}` : ''}`);
  }
}
