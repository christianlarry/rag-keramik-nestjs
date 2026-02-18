import { DomainEvent } from 'src/core/domain/domain-event.base';

interface ProductPriceChangedPayload {
  productId: string;
  sku: string;
  oldPrice: number;
  newPrice: number;
  currency: string;
  changedBy?: string;
}

export class ProductPriceChangedEvent extends DomainEvent<ProductPriceChangedPayload> {
  constructor(payload: ProductPriceChangedPayload) {
    super(payload, ProductPriceChangedEvent.EventName);
  }

  public static get EventName(): string {
    return 'product.price_changed';
  }
}
