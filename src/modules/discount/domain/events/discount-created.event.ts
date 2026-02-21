import { DomainEvent } from 'src/core/domain/domain-event.base';

interface DiscountCreatedPayload {
  discountId: string;
  code: string;
  name: string;
  type: string;
  value: number;
  applicability: string;
  startDate: Date;
  endDate: Date;
  status: string;
}

export class DiscountCreatedEvent extends DomainEvent<DiscountCreatedPayload> {
  constructor(payload: DiscountCreatedPayload) {
    super(payload, DiscountCreatedEvent.EventName);
  }

  public static get EventName(): string {
    return 'discount.created';
  }
}
