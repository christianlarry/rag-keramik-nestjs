import { DomainError } from 'src/core/domain/domain-error.base';
import { DiscountErrorCode } from './enums/discount-error-code.enum';

export class InvalidDiscountValueError extends DomainError {
  readonly code = DiscountErrorCode.INVALID_DISCOUNT_VALUE;

  constructor(reason: string) {
    super(`Invalid discount value: ${reason}`);
  }
}
