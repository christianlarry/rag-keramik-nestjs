import { DomainError } from 'src/core/domain/domain-error.base';
import { OrderErrorCode } from './enums/order-error-code.enum';

export class OrderCannotBeCancelledError extends DomainError {
  readonly code = OrderErrorCode.ORDER_CANNOT_BE_CANCELLED;

  constructor(orderId: string, currentStatus: string) {
    super(
      `Order ${orderId} cannot be cancelled in status '${currentStatus}'`,
    );
  }
}
