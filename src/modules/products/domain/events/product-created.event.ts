import { DomainEvent } from 'src/core/domain/domain-event.base';

interface ProductCreatedPayload {
  productId: string;
  sku: string;
  name: string;
  price: number;
  currency: string;
  brand?: string;
  status: string;
}

export class ProductCreatedEvent extends DomainEvent {
  constructor(public readonly payload: ProductCreatedPayload) {
    super('product.created', payload);
  }
}
