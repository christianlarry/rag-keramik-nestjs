import { ApplicationError } from "src/core/application/application-error.base";
import { ProductApplicationErrorEnum } from "./enums/product-application-error.enum";

export class ProductNotFoundError extends ApplicationError {
  readonly code = ProductApplicationErrorEnum.PRODUCT_NOT_FOUND;

  constructor(productId: string) {
    super(`Product with id ${productId} not found`);
  }
}