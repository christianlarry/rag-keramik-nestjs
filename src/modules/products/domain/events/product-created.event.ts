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

export class ProductCreatedEvent extends DomainEvent<ProductCreatedPayload> {
  constructor(payload: ProductCreatedPayload) {
    super(payload, ProductCreatedEvent.EventName);
  }

  public static get EventName(): string {
    return 'product.created';
  }
}
