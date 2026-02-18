import { DomainEvent } from 'src/core/domain/domain-event.base';

interface ProductDiscontinuedPayload {
  productId: string;
  sku: string;
  name: string;
  previousStatus: string;
  reason?: string;
}

export class ProductDiscontinuedEvent extends DomainEvent<ProductDiscontinuedPayload> {
  constructor(payload: ProductDiscontinuedPayload) {
    super(payload, ProductDiscontinuedEvent.EventName);
  }

  public static get EventName(): string {
    return 'product.discontinued';
  }
}
