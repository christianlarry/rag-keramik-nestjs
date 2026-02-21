import { DomainError } from 'src/core/domain/domain-error.base';
import { DiscountErrorCode } from './enums/discount-error-code.enum';

export class InvalidDiscountCodeError extends DomainError {
  readonly code = DiscountErrorCode.INVALID_DISCOUNT_CODE;

  constructor(discountCode: string, reason?: string) {
    super(
      `Invalid discount code: ${discountCode}${reason ? `. ${reason}` : ''}`,
    );
  }
}
