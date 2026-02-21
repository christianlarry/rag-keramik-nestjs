import { DomainError } from 'src/core/domain/domain-error.base';
import { OrderErrorCode } from './enums/order-error-code.enum';

export class InvalidOrderItemIdError extends DomainError {
  readonly code = OrderErrorCode.INVALID_ORDER_ITEM_ID;

  constructor(orderItemId: string) {
    super(`Invalid order item ID: ${orderItemId}`);
  }
}
