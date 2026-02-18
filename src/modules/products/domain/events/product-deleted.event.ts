import { DomainEvent } from 'src/core/domain/domain-event.base';

interface ProductDeletedPayload {
  productId: string;
  sku: string;
  name: string;
}

export class ProductDeletedEvent extends DomainEvent<ProductDeletedPayload> {
  constructor(payload: ProductDeletedPayload) {
    super(payload, ProductDeletedEvent.EventName);
  }

  public static get EventName(): string {
    return 'product.deleted';
  }
}
