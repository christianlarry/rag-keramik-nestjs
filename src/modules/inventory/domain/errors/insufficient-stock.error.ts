import { DomainError } from 'src/core/domain/domain-error.base';
import { InventoryErrorCode } from './enums/inventory-error-code.enum';

export class InsufficientStockError extends DomainError {
  readonly code = InventoryErrorCode.INSUFFICIENT_STOCK;

  constructor(productId: string, requested: number, available: number) {
    super(
      `Insufficient stock for product ${productId}: requested ${requested}, available ${available}`,
    );
  }
}
