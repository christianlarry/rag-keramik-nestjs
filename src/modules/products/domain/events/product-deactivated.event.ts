import { DomainEvent } from 'src/core/domain/domain-event.base';

interface ProductDeactivatedPayload {
  productId: string;
  sku: string;
  previousStatus: string;
  reason?: string;
}

export class ProductDeactivatedEvent extends DomainEvent<ProductDeactivatedPayload> {
  constructor(payload: ProductDeactivatedPayload) {
    super(payload, ProductDeactivatedEvent.EventName);
  }

  public static get EventName(): string {
    return 'product.deactivated';
  }
}
