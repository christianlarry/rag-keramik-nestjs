import { DomainError } from 'src/core/domain/domain-error.base';
import { DiscountErrorCode } from './enums/discount-error-code.enum';

export class InvalidDiscountStatusTransitionError extends DomainError {
  readonly code = DiscountErrorCode.INVALID_STATUS_TRANSITION;

  constructor(currentStatus: string, newStatus: string) {
    super(
      `Invalid discount status transition from '${currentStatus}' to '${newStatus}'`,
    );
  }
}
