import { DomainEvent } from 'src/core/domain/domain-event.base';

interface ProductUpdatedPayload {
  productId: string;
  sku: string;
  changes: {
    name?: boolean;
    description?: boolean;
    price?: boolean;
    brand?: boolean;
    imageUrl?: boolean;
    attributes?: boolean;
    tilePerBox?: boolean;
  };
}

export class ProductUpdatedEvent extends DomainEvent {
  constructor(public readonly payload: ProductUpdatedPayload) {
    super('product.updated', payload);
  }
}
