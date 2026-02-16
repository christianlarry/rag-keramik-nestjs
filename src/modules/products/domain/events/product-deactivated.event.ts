import { DomainEvent } from 'src/core/domain/domain-event.base';

interface ProductDeactivatedPayload {
  productId: string;
  sku: string;
  previousStatus: string;
  reason?: string;
}

export class ProductDeactivatedEvent extends DomainEvent {
  constructor(public readonly payload: ProductDeactivatedPayload) {
    super('product.deactivated', payload);
  }
}
