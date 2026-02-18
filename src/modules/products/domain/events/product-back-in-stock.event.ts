import { DomainEvent } from 'src/core/domain/domain-event.base';

interface ProductBackInStockPayload {
  productId: string;
  sku: string;
  name: string;
}

export class ProductBackInStockEvent extends DomainEvent<ProductBackInStockPayload> {
  constructor(payload: ProductBackInStockPayload) {
    super(payload, ProductBackInStockEvent.EventName);
  }

  public static get EventName(): string {
    return 'product.back_in_stock';
  }
}
