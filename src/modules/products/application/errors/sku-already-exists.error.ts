import { ApplicationError } from 'src/core/application/application-error.base';
import { ProductApplicationErrorEnum } from './enums/product-application-error.enum';

export class SKUAlreadyExistsError extends ApplicationError {
  readonly code = ProductApplicationErrorEnum.SKU_ALREADY_EXISTS;

  constructor(sku: string) {
    super(`SKU already exists: ${sku}`);
  }
}
