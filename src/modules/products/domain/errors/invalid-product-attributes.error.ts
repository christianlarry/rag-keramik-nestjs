import { DomainError } from 'src/core/domain/domain-error.base';
import { ProductErrorCode } from './enums/product-error-code.enum';

export class InvalidProductAttributesError extends DomainError {
  readonly code = ProductErrorCode.INVALID_ATTRIBUTES;

  constructor(reason: string) {
    super(`Invalid product attributes: ${reason}`);
  }
}
