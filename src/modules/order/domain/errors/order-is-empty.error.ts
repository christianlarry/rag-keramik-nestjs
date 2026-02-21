import { DomainError } from 'src/core/domain/domain-error.base';
import { OrderErrorCode } from './enums/order-error-code.enum';

export class OrderIsEmptyError extends DomainError {
  readonly code = OrderErrorCode.ORDER_IS_EMPTY;

  constructor(orderId: string) {
    super(`Order has no items: ${orderId}`);
  }
}
