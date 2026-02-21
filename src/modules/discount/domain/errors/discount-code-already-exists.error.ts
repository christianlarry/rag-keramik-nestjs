import { DomainError } from 'src/core/domain/domain-error.base';
import { DiscountErrorCode } from './enums/discount-error-code.enum';

export class DiscountCodeAlreadyExistsError extends DomainError {
  readonly code = DiscountErrorCode.DISCOUNT_CODE_ALREADY_EXISTS;

  constructor(code: string) {
    super(`Discount code already exists: ${code}`);
  }
}
