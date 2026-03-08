import { ApplicationEvent } from "src/core/application/application-event.base";

export interface ProductUpdatedAppEventPayload {
  productId: string;
  updatedBy: string;
  fieldsUpdated: string[];
}

export class ProductUpdatedAppEvent extends ApplicationEvent<ProductUpdatedAppEventPayload> {

  constructor(payload: ProductUpdatedAppEventPayload) {
    super(payload, ProductUpdatedAppEvent.EventName);
  }

  public static get EventName(): string {
    return "appevent.product.updated";
  }
}