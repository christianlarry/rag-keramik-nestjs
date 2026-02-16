import { DomainEvent } from 'src/core/domain/domain-event.base';

interface ProductBackInStockPayload {
  productId: string;
  sku: string;
  name: string;
}

export class ProductBackInStockEvent extends DomainEvent {
  constructor(public readonly payload: ProductBackInStockPayload) {
    super('product.back_in_stock', payload);
  }
}
