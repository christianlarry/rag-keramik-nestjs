import { DomainEvent } from 'src/core/domain/domain-event.base';

interface StockReleasedPayload {
  inventoryId: string;
  productId: string;
  quantity: number;
  totalReserved: number;
  availableStock: number;
}

export class StockReleasedEvent extends DomainEvent<StockReleasedPayload> {
  constructor(payload: StockReleasedPayload) {
    super(payload, StockReleasedEvent.EventName);
  }

  public static get EventName(): string {
    return 'inventory.stock_released';
  }
}
