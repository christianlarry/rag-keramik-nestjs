import { DomainEvent } from 'src/core/domain/domain-event.base';

interface ProductActivatedPayload {
  productId: string;
  sku: string;
  previousStatus: string;
}

export class ProductActivatedEvent extends DomainEvent {
  constructor(public readonly payload: ProductActivatedPayload) {
    super('product.activated', payload);
  }
}
