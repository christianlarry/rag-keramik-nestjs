import { DomainEvent } from "src/core/domain/domain-event.base";

interface PhoneNumberUpdatedEventPayload {
  readonly userId: string;
  readonly phoneNumber: string | null;
  readonly wasVerified: boolean;
}

export class PhoneNumberUpdatedEvent extends DomainEvent<PhoneNumberUpdatedEventPayload> {
  constructor(
    payload: PhoneNumberUpdatedEventPayload
  ) {
    super(
      payload,
      PhoneNumberUpdatedEvent.EventName
    )
  }

  public static get EventName(): string {
    return 'user.phone_number_updated';
  }
}
