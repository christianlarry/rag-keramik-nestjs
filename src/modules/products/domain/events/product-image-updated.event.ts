import { DomainEvent } from 'src/core/domain/domain-event.base';

interface ProductImageUpdatedPayload {
  productId: string;
  sku: string;
  oldImageUrl?: string;
  newImageUrl?: string;
}

export class ProductImageUpdatedEvent extends DomainEvent {
  constructor(public readonly payload: ProductImageUpdatedPayload) {
    super('product.image_updated', payload);
  }
}
