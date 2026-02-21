import { DomainError } from 'src/core/domain/domain-error.base';
import { DiscountErrorCode } from './enums/discount-error-code.enum';

export class DiscountAlreadyExistsError extends DomainError {
  readonly code = DiscountErrorCode.DISCOUNT_ALREADY_EXISTS;

  constructor(identifier: string) {
    super(`Discount already exists: ${identifier}`);
  }
}
