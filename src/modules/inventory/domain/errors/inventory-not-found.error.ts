import { DomainError } from 'src/core/domain/domain-error.base';
import { InventoryErrorCode } from './enums/inventory-error-code.enum';

export class InventoryNotFoundError extends DomainError {
  readonly code = InventoryErrorCode.INVENTORY_NOT_FOUND;

  constructor(identifier: string) {
    super(`Inventory not found: ${identifier}`);
  }
}
