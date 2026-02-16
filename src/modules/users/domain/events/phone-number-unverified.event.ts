import { DomainEvent } from "src/core/domain/domain-event.base";

interface PhoneNumberUnverifiedEventPayload {
  readonly userId: string;
}

export class PhoneNumberUnverifiedEvent extends DomainEvent<PhoneNumberUnverifiedEventPayload> {
  constructor(
    payload: PhoneNumberUnverifiedEventPayload
  ) {
    super(
      payload,
      PhoneNumberUnverifiedEvent.EventName
    )
  }

  public static get EventName(): string {
    return 'user.phone_number_unverified';
  }
}
