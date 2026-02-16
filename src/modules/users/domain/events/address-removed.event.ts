import { DomainEvent } from "src/core/domain/domain-event.base";

interface AddressRemovedEventPayload {
  readonly userId: string;
  readonly addressIndex: number;
}

export class AddressRemovedEvent extends DomainEvent<AddressRemovedEventPayload> {
  constructor(
    payload: AddressRemovedEventPayload
  ) {
    super(
      payload,
      AddressRemovedEvent.EventName
    )
  }

  public static get EventName(): string {
    return 'user.address_removed';
  }
}
