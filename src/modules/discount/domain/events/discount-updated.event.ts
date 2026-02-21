import { DomainEvent } from 'src/core/domain/domain-event.base';

interface DiscountUpdatedPayload {
  discountId: string;
  code: string;
  changes: Record<string, boolean>;
  updatedAt: Date;
}

export class DiscountUpdatedEvent extends DomainEvent<DiscountUpdatedPayload> {
  constructor(payload: DiscountUpdatedPayload) {
    super(payload, DiscountUpdatedEvent.EventName);
  }

  public static get EventName(): string {
    return 'discount.updated';
  }
}
