import { DomainError } from 'src/core/domain/domain-error.base';
import { OrderErrorCode } from './enums/order-error-code.enum';

export class InvalidOrderIdError extends DomainError {
  readonly code = OrderErrorCode.INVALID_ORDER_ID;

  constructor(orderId: string) {
    super(`Invalid order ID: ${orderId}`);
  }
}
