import { DomainError } from 'src/core/domain/domain-error.base';
import { OrderErrorCode } from './enums/order-error-code.enum';

export class OrderStateConflictError extends DomainError {
  readonly code = OrderErrorCode.STATE_CONFLICT;

  constructor(message: string = 'Order state conflict error') {
    super(message);
  }
}
