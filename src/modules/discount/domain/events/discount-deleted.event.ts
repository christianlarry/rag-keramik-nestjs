import { DomainEvent } from 'src/core/domain/domain-event.base';

interface DiscountDeletedPayload {
  discountId: string;
  code: string;
  name: string;
}

export class DiscountDeletedEvent extends DomainEvent<DiscountDeletedPayload> {
  constructor(payload: DiscountDeletedPayload) {
    super(payload, DiscountDeletedEvent.EventName);
  }

  public static get EventName(): string {
    return 'discount.deleted';
  }
}
