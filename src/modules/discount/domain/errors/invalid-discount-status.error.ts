import { DomainError } from 'src/core/domain/domain-error.base';
import { DiscountErrorCode } from './enums/discount-error-code.enum';

export class InvalidDiscountStatusError extends DomainError {
  readonly code = DiscountErrorCode.INVALID_DISCOUNT_STATUS;

  constructor(status: string) {
    super(`Invalid discount status: ${status}`);
  }
}
