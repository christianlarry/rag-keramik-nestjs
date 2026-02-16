import { DomainError } from 'src/core/domain/domain-error.base';
import { ProductErrorCode } from './enums/product-error-code.enum';

export class SKUAlreadyExistsError extends DomainError {
  readonly code = ProductErrorCode.SKU_ALREADY_EXISTS;

  constructor(sku: string) {
    super(`SKU already exists: ${sku}`);
  }
}
