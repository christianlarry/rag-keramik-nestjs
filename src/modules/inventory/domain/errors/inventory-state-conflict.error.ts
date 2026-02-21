import { DomainError } from 'src/core/domain/domain-error.base';
import { InventoryErrorCode } from './enums/inventory-error-code.enum';

export class InventoryStateConflictError extends DomainError {
  readonly code = InventoryErrorCode.STATE_CONFLICT;

  constructor(message: string = 'Inventory state conflict error') {
    super(message);
  }
}
