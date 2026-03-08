import { ApplicationEvent } from "src/core/application/application-event.base";

export interface ProductCreatedAppEventPayload {
  productId: string;
  createdBy: string;
}

export class ProductCreatedAppEvent extends ApplicationEvent<ProductCreatedAppEventPayload> {

  constructor(payload: ProductCreatedAppEventPayload) {
    super(payload, ProductCreatedAppEvent.EventName);
  }

  public static get EventName(): string {
    return "appevent.product.created";
  }
}