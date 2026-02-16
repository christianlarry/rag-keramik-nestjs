import { DomainEvent } from "src/core/domain/domain-event.base";

interface PhoneNumberVerifiedEventPayload {
  readonly userId: string;
  readonly phoneNumber: string;
  readonly verifiedAt: Date;
}

export class PhoneNumberVerifiedEvent extends DomainEvent<PhoneNumberVerifiedEventPayload> {
  constructor(
    payload: PhoneNumberVerifiedEventPayload
  ) {
    super(
      payload,
      PhoneNumberVerifiedEvent.EventName
    )
  }

  public static get EventName(): string {
    return 'user.phone_number_verified';
  }
}
