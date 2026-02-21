import { DomainEvent } from 'src/core/domain/domain-event.base';

interface DiscountAppliedPayload {
  discountId: string;
  code: string;
  orderId: string;
  discountAmount: number;
  currency: string;
  usageCount: number;
}

export class DiscountAppliedEvent extends DomainEvent<DiscountAppliedPayload> {
  constructor(payload: DiscountAppliedPayload) {
    super(payload, DiscountAppliedEvent.EventName);
  }

  public static get EventName(): string {
    return 'discount.applied';
  }
}
