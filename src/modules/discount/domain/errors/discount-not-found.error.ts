import { DomainError } from 'src/core/domain/domain-error.base';
import { DiscountErrorCode } from './enums/discount-error-code.enum';

export class DiscountNotFoundError extends DomainError {
  readonly code = DiscountErrorCode.DISCOUNT_NOT_FOUND;

  constructor(identifier: string) {
    super(`Discount not found: ${identifier}`);
  }
}
