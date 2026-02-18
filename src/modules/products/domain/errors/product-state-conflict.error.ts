import { DomainError } from "src/core/domain/domain-error.base";
import { ProductErrorCode } from "./enums/product-error-code.enum";

export class ProductStateConflictError extends DomainError {
  readonly code = ProductErrorCode.STATE_CONFLICT;

  constructor(message: string = 'Product state conflict error') {
    super(message);
  }
}