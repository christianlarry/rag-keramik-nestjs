import { Injectable } from "@nestjs/common";
import { AuditService } from "src/core/infrastructure/services/audit/audit.service";
import { UserProfileUpdatedEvent } from "../../domain/events/user-profile-updated.event";
import { OnEvent } from "@nestjs/event-emitter";
import { AuditAction } from "src/core/infrastructure/services/audit/enums/audit-action.enum";
import { AuditTargetType } from "src/core/infrastructure/services/audit/enums/audit-target-type.enum";

@Injectable()
export class AuditLogUserProfileUpdatedListener {
  constructor(
    private readonly audit: AuditService,
  ) { }

  @OnEvent(UserProfileUpdatedEvent.EventName, { async: true })
  async handle(e: UserProfileUpdatedEvent): Promise<void> {
    const profile = e.payload.profile;

    const fieldsUpdated: string[] = [];
    if (profile.name) fieldsUpdated.push('name');
    if (profile.dateOfBirth) fieldsUpdated.push('dateOfBirth');
    if (profile.gender) fieldsUpdated.push('gender');
    if (profile.avatarUrl) fieldsUpdated.push('avatarUrl');

    await this.audit.logUserAction(
      e.payload.userId,
      AuditAction.PROFILE_UPDATE,
      AuditTargetType.USER,
      e.payload.userId,
      {
        fieldsUpdated: fieldsUpdated.join(', ')
      }
    )
  }
}