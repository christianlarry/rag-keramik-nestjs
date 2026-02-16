import { DomainEvent } from "src/core/domain/domain-event.base";

interface AuthUserUpdatedEventPayload {
  readonly userId: string;
  readonly email: string;
}

export class AuthUserUpdatedEvent extends DomainEvent<AuthUserUpdatedEventPayload> {
  constructor(
    payload: AuthUserUpdatedEventPayload
  ) {
    super(
      payload,
      AuthUserUpdatedEvent.EventName
    )
  }

  public static get EventName(): string {
    return 'auth_user.updated';
  }
}