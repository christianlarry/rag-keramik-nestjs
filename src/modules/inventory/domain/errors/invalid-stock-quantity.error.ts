import { DomainError } from 'src/core/domain/domain-error.base';
import { InventoryErrorCode } from './enums/inventory-error-code.enum';

export class InvalidStockQuantityError extends DomainError {
  readonly code = InventoryErrorCode.INVALID_STOCK_QUANTITY;

  constructor(quantity: number, reason?: string) {
    super(
      `Invalid stock quantity: ${quantity}${reason ? `. ${reason}` : ''}`,
    );
  }
}
