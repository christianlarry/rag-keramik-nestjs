import { DomainEvent } from 'src/core/domain/domain-event.base';

interface DiscountExpiredEventPayload {
  discountId: string;
  code: string;
  endDate: Date;
}

export class DiscountExpiredEvent extends DomainEvent<DiscountExpiredEventPayload> {
  constructor(payload: DiscountExpiredEventPayload) {
    super(payload, DiscountExpiredEvent.EventName);
  }

  public static get EventName(): string {
    return 'discount.expired';
  }
}
