import { DomainEvent } from "src/core/domain/domain-event.base";

interface UserUpdatedEventPayload {
  readonly userId: string;
  readonly email: string;
  readonly phoneNumber?: string;
  readonly updatedAt: Date;
}

export class UserUpdatedEvent extends DomainEvent<UserUpdatedEventPayload> {
  constructor(
    payload: UserUpdatedEventPayload
  ) {
    super(
      payload,
      UserUpdatedEvent.EventName
    )
  }

  public static get EventName(): string {
    return 'user.updated';
  }
}