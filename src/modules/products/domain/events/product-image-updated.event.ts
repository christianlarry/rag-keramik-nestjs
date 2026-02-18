import { DomainEvent } from 'src/core/domain/domain-event.base';

interface ProductImageUpdatedPayload {
  productId: string;
  sku: string;
  oldImageUrl?: string;
  newImageUrl?: string;
}

export class ProductImageUpdatedEvent extends DomainEvent<ProductImageUpdatedPayload> {
  constructor(payload: ProductImageUpdatedPayload) {
    super(payload, ProductImageUpdatedEvent.EventName);
  }

  public static get EventName(): string {
    return 'product.image_updated';
  }
}
