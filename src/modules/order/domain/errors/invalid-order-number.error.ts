import { DomainError } from 'src/core/domain/domain-error.base';
import { OrderErrorCode } from './enums/order-error-code.enum';

export class InvalidOrderNumberError extends DomainError {
  readonly code = OrderErrorCode.INVALID_ORDER_NUMBER;

  constructor(orderNumber: string, reason?: string) {
    super(
      `Invalid order number: ${orderNumber}${reason ? `. ${reason}` : ''}`,
    );
  }
}
