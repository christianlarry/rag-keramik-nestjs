import { DomainError } from 'src/core/domain/domain-error.base';
import { OrderErrorCode } from './enums/order-error-code.enum';

export class OrderAlreadyExistsError extends DomainError {
  readonly code = OrderErrorCode.ORDER_ALREADY_EXISTS;

  constructor(identifier: string) {
    super(`Order already exists: ${identifier}`);
  }
}
