import { DomainEvent } from "src/core/domain/domain-event.base";

interface AddressAddedEventPayload {
  readonly userId: string;
  readonly addressIndex: number;
}

export class AddressAddedEvent extends DomainEvent<AddressAddedEventPayload> {
  constructor(
    payload: AddressAddedEventPayload
  ) {
    super(
      payload,
      AddressAddedEvent.EventName
    )
  }

  public static get EventName(): string {
    return 'user.address_added';
  }
}
