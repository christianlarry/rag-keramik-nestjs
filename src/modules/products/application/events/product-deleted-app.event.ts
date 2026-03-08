import { ApplicationEvent } from "src/core/application/application-event.base";

export interface ProductDeletedAppEventPayload {
  productId: string;
  deletedBy: string;
}

export class ProductDeletedAppEvent extends ApplicationEvent<ProductDeletedAppEventPayload> {

  constructor(payload: ProductDeletedAppEventPayload) {
    super(payload, ProductDeletedAppEvent.EventName);
  }

  public static get EventName(): string {
    return "appevent.product.deleted";
  }
}