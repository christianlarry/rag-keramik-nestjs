import { DomainEvent } from 'src/core/domain/domain-event.base';

interface ProductDeletedPayload {
  productId: string;
  sku: string;
  name: string;
}

export class ProductDeletedEvent extends DomainEvent {
  constructor(public readonly payload: ProductDeletedPayload) {
    super('product.deleted', payload);
  }
}
