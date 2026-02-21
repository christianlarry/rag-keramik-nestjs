import { DomainError } from 'src/core/domain/domain-error.base';
import { DiscountErrorCode } from './enums/discount-error-code.enum';

export class InvalidDiscountPeriodError extends DomainError {
  readonly code = DiscountErrorCode.INVALID_DISCOUNT_PERIOD;

  constructor(reason: string) {
    super(`Invalid discount period: ${reason}`);
  }
}
