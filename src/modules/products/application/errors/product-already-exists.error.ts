import { ApplicationError } from 'src/core/application/application-error.base';
import { ProductApplicationErrorEnum } from './enums/product-application-error.enum';

export class ProductAlreadyExistsError extends ApplicationError {
  readonly code = ProductApplicationErrorEnum.PRODUCT_ALREADY_EXISTS;

  constructor(identifier: string) {
    super(`Product already exists: ${identifier}`);
  }
}
