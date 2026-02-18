import { DomainEvent } from 'src/core/domain/domain-event.base';

interface ProductActivatedPayload {
  productId: string;
  sku: string;
  previousStatus: string;
}

export class ProductActivatedEvent extends DomainEvent<ProductActivatedPayload> {
  constructor(payload: ProductActivatedPayload) {
    super(payload, ProductActivatedEvent.EventName);
  }

  public static get EventName(): string {
    return 'product.activated';
  }
}
