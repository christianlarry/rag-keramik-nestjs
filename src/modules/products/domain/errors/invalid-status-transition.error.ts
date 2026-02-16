import { DomainError } from 'src/core/domain/domain-error.base';
import { ProductErrorCode } from './enums/product-error-code.enum';

export class InvalidStatusTransitionError extends DomainError {
  readonly code = ProductErrorCode.INVALID_STATUS_TRANSITION;

  constructor(currentStatus: string, newStatus: string) {
    super(
      `Invalid status transition from ${currentStatus} to ${newStatus}`,
    );
  }
}
