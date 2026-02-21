import { DomainEvent } from 'src/core/domain/domain-event.base';

interface StockReservedPayload {
  inventoryId: string;
  productId: string;
  quantity: number;
  totalReserved: number;
  availableStock: number;
}

export class StockReservedEvent extends DomainEvent<StockReservedPayload> {
  constructor(payload: StockReservedPayload) {
    super(payload, StockReservedEvent.EventName);
  }

  public static get EventName(): string {
    return 'inventory.stock_reserved';
  }
}
