import { DomainEvent } from 'src/core/domain/domain-event.base';

interface ProductPriceChangedPayload {
  productId: string;
  sku: string;
  oldPrice: number;
  newPrice: number;
  currency: string;
  changedBy?: string;
}

export class ProductPriceChangedEvent extends DomainEvent {
  constructor(public readonly payload: ProductPriceChangedPayload) {
    super('product.price_changed', payload);
  }
}
