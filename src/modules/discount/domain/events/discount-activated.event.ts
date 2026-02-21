import { DomainEvent } from 'src/core/domain/domain-event.base';

interface DiscountActivatedPayload {
  discountId: string;
  code: string;
  previousStatus: string;
}

export class DiscountActivatedEvent extends DomainEvent<DiscountActivatedPayload> {
  constructor(payload: DiscountActivatedPayload) {
    super(payload, DiscountActivatedEvent.EventName);
  }

  public static get EventName(): string {
    return 'discount.activated';
  }
}
