import { DomainEvent } from 'src/core/domain/domain-event.base';

interface StockAdjustedPayload {
  inventoryId: string;
  productId: string;
  previousStock: number;
  newStock: number;
  adjustment: number;
  reason?: string;
}

export class StockAdjustedEvent extends DomainEvent<StockAdjustedPayload> {
  constructor(payload: StockAdjustedPayload) {
    super(payload, StockAdjustedEvent.EventName);
  }

  public static get EventName(): string {
    return 'inventory.stock_adjusted';
  }
}
