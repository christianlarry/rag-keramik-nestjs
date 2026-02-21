import { DomainError } from 'src/core/domain/domain-error.base';
import { InventoryErrorCode } from './enums/inventory-error-code.enum';

export class InventoryAlreadyExistsError extends DomainError {
  readonly code = InventoryErrorCode.INVENTORY_ALREADY_EXISTS;

  constructor(productId: string) {
    super(`Inventory already exists for product: ${productId}`);
  }
}
