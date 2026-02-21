import { DomainError } from 'src/core/domain/domain-error.base';
import { DiscountErrorCode } from './enums/discount-error-code.enum';

export class InvalidDiscountIdError extends DomainError {
  readonly code = DiscountErrorCode.INVALID_DISCOUNT_ID;

  constructor(discountId: string) {
    super(`Invalid discount ID: ${discountId}`);
  }
}
