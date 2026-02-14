import { DomainEvent } from "src/core/domain/domain-event.base";
import { Name } from "../value-objects/name.vo";
import { DateOfBirth } from "../value-objects/date-of-birth.vo";
import { Gender } from "../value-objects/gender.vo";
import { Avatar } from "../value-objects/avatar.vo";

interface UserProfileUpdatedEventPayload {
  readonly userId: string;
  readonly profile: {
    name?: Name;
    dateOfBirth?: DateOfBirth | null;
    gender?: Gender | null;
    avatarUrl?: Avatar | null;
  }
}

export class UserProfileUpdatedEvent extends DomainEvent<UserProfileUpdatedEventPayload> {
  constructor(
    payload: UserProfileUpdatedEventPayload
  ) {
    super(
      payload,
      UserProfileUpdatedEvent.EventName
    )
  }

  public static get EventName(): string {
    return 'user.updated_profile';
  }
}