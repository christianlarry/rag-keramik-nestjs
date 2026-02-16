import { DomainEvent } from 'src/core/domain/domain-event.base';

interface ProductOutOfStockPayload {
  productId: string;
  sku: string;
  name: string;
  previousStatus: string;
}

export class ProductOutOfStockEvent extends DomainEvent {
  constructor(public readonly payload: ProductOutOfStockPayload) {
    super('product.out_of_stock', payload);
  }
}
