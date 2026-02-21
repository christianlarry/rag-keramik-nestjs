import { DomainEvent } from 'src/core/domain/domain-event.base';

interface InventoryCreatedPayload {
  inventoryId: string;
  productId: string;
  initialStock: number;
}

export class InventoryCreatedEvent extends DomainEvent<InventoryCreatedPayload> {
  constructor(payload: InventoryCreatedPayload) {
    super(payload, InventoryCreatedEvent.EventName);
  }

  public static get EventName(): string {
    return 'inventory.created';
  }
}
