import { DomainError } from 'src/core/domain/domain-error.base';
import { OrderErrorCode } from './enums/order-error-code.enum';

export class InvalidOrderStatusTransitionError extends DomainError {
  readonly code = OrderErrorCode.INVALID_STATUS_TRANSITION;

  constructor(currentStatus: string, newStatus: string) {
    super(
      `Invalid order status transition from '${currentStatus}' to '${newStatus}'`,
    );
  }
}
