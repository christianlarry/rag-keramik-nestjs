import { DomainEvent } from 'src/core/domain/domain-event.base';

interface ProductDiscontinuedPayload {
  productId: string;
  sku: string;
  name: string;
  previousStatus: string;
  reason?: string;
}

export class ProductDiscontinuedEvent extends DomainEvent {
  constructor(public readonly payload: ProductDiscontinuedPayload) {
    super('product.discontinued', payload);
  }
}
