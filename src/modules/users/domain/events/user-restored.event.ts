import { DomainEvent } from "src/core/domain/domain-event.base";

interface UserRestoredEventPayload {
  readonly userId: string;
  readonly restoredAt: Date;
}

export class UserRestoredEvent extends DomainEvent<UserRestoredEventPayload> {
  constructor(
    payload: UserRestoredEventPayload
  ) {
    super(
      payload,
      UserRestoredEvent.EventName
    )
  }

  public static get EventName(): string {
    return 'user.profile_restored';
  }
}
