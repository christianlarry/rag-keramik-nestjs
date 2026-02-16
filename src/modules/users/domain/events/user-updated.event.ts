import { DomainEvent } from "src/core/domain/domain-event.base";

interface UserUpdatedEventPayload {
  userId: string;
  email: string;
  phoneNumber?: string;
}

export class UserUpdatedEvent extends DomainEvent<UserUpdatedEventPayload> {
  constructor(payload: UserUpdatedEventPayload) {
    super(
      payload,
      UserUpdatedEvent.EventName
    );
  }

  public static get EventName(): string {
    return 'user.updated';
  }
}