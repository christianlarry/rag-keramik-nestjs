import { DomainEvent } from 'src/core/domain/domain-event.base';

interface DiscountDeactivatedPayload {
  discountId: string;
  code: string;
  previousStatus: string;
  reason?: string;
}

export class DiscountDeactivatedEvent extends DomainEvent<DiscountDeactivatedPayload> {
  constructor(payload: DiscountDeactivatedPayload) {
    super(payload, DiscountDeactivatedEvent.EventName);
  }

  public static get EventName(): string {
    return 'discount.deactivated';
  }
}
