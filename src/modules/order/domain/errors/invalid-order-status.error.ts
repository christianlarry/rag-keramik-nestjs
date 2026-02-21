import { DomainError } from 'src/core/domain/domain-error.base';
import { OrderErrorCode } from './enums/order-error-code.enum';

export class InvalidOrderStatusError extends DomainError {
  readonly code = OrderErrorCode.INVALID_ORDER_STATUS;

  constructor(status: string) {
    super(`Invalid order status: ${status}`);
  }
}
