import { DomainEvent } from 'src/core/domain/domain-event.base';

interface StockDepletedPayload {
  inventoryId: string;
  productId: string;
}

export class StockDepletedEvent extends DomainEvent<StockDepletedPayload> {
  constructor(payload: StockDepletedPayload) {
    super(payload, StockDepletedEvent.EventName);
  }

  public static get EventName(): string {
    return 'inventory.stock_depleted';
  }
}
