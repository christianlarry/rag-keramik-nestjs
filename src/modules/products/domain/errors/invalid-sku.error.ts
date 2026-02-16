import { DomainError } from 'src/core/domain/domain-error.base';
import { ProductErrorCode } from './enums/product-error-code.enum';

export class InvalidSKUError extends DomainError {
  readonly code = ProductErrorCode.INVALID_SKU;

  constructor(sku: string, reason?: string) {
    super(`Invalid SKU: ${sku}${reason ? `. ${reason}` : ''}`);
  }
}
