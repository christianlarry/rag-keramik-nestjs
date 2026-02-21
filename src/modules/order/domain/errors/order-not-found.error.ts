import { DomainError } from 'src/core/domain/domain-error.base';
import { OrderErrorCode } from './enums/order-error-code.enum';

export class OrderNotFoundError extends DomainError {
  readonly code = OrderErrorCode.ORDER_NOT_FOUND;

  constructor(identifier: string) {
    super(`Order not found: ${identifier}`);
  }
}
