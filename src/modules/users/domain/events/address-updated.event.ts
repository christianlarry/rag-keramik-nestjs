import { DomainEvent } from "src/core/domain/domain-event.base";

interface AddressUpdatedEventPayload {
  readonly userId: string;
  readonly addressIndex: number;
}

export class AddressUpdatedEvent extends DomainEvent<AddressUpdatedEventPayload> {
  constructor(
    payload: AddressUpdatedEventPayload
  ) {
    super(
      payload,
      AddressUpdatedEvent.EventName
    )
  }

  public static get EventName(): string {
    return 'user.address_updated';
  }
}
