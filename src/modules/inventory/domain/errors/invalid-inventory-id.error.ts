import { DomainError } from 'src/core/domain/domain-error.base';
import { InventoryErrorCode } from './enums/inventory-error-code.enum';

export class InvalidInventoryIdError extends DomainError {
  readonly code = InventoryErrorCode.INVALID_INVENTORY_ID;

  constructor(inventoryId: string) {
    super(`Invalid inventory ID: ${inventoryId}`);
  }
}
