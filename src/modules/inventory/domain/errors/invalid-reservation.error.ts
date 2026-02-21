import { DomainError } from 'src/core/domain/domain-error.base';
import { InventoryErrorCode } from './enums/inventory-error-code.enum';

export class InvalidReservationError extends DomainError {
  readonly code = InventoryErrorCode.INVALID_RESERVATION;

  constructor(reason: string) {
    super(`Invalid reservation: ${reason}`);
  }
}
