import { DomainEvent } from 'src/core/domain/domain-event.base';

interface ProductOutOfStockPayload {
  productId: string;
  sku: string;
  name: string;
  previousStatus: string;
}

export class ProductOutOfStockEvent extends DomainEvent<ProductOutOfStockPayload> {
  constructor(payload: ProductOutOfStockPayload) {
    super(payload, ProductOutOfStockEvent.EventName);
  }

  public static get EventName(): string {
    return 'product.out_of_stock';
  }
}
