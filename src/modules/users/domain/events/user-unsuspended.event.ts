import { DomainEvent } from "src/core/domain/domain-event.base";

interface UserUnsuspendedEventPayload {
  readonly userId: string;
  readonly unsuspendedAt: Date;
}

export class UserUnsuspendedEvent extends DomainEvent<UserUnsuspendedEventPayload> {
  constructor(
    payload: UserUnsuspendedEventPayload
  ) {
    super(
      payload,
      UserUnsuspendedEvent.EventName
    )
  }

  public static get EventName(): string {
    return 'user.profile_unsuspended';
  }
}
