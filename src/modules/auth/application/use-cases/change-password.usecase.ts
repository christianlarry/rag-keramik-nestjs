import { Inject, Injectable } from "@nestjs/common";
import { AUTH_USER_REPOSITORY_TOKEN, type AuthUserRepository } from "../../domain/repositories/auth-user-repository.interface";
import { AuthUserNotFoundError, CannotChangePasswordError } from "../../domain/errors";
import { PASSWORD_HASHER_TOKEN, type PasswordHasher } from "../../domain/services/password-hasher.interface";
import { Password } from "../../domain/value-objects/password.vo";
import { UNIT_OF_WORK_TOKEN, type UnitOfWork } from "src/core/application/unit-of-work.interface";
import { AuditService } from "src/modules/audit/audit.service";
import { AuditAction, AuditTargetType } from "src/generated/prisma/enums";

interface ChangePasswordCommand {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

@Injectable()
export class ChangePasswordUseCase {

  constructor(
    @Inject(AUTH_USER_REPOSITORY_TOKEN)
    private readonly authUserRepository: AuthUserRepository,
    @Inject(PASSWORD_HASHER_TOKEN)
    private readonly passwordHasher: PasswordHasher,
    @Inject(UNIT_OF_WORK_TOKEN)
    private readonly uow: UnitOfWork,

    private readonly audit: AuditService
  ) { }

  async execute(command: ChangePasswordCommand): Promise<void> {

    // Validate New Password - Ensure it before any processing
    Password.validateRaw(command.newPassword);

    // Find the user by ID
    const authUser = await this.authUserRepository.findById(command.userId);
    if (!authUser) {
      throw new AuthUserNotFoundError();
    }

    authUser.ensureCanChangePassword();

    // Verify current password
    const isCurrentPasswordValid = await this.passwordHasher.compare(
      command.currentPassword,
      authUser.password!.getValue()
    );
    if (!isCurrentPasswordValid) {
      throw new CannotChangePasswordError('Current password is incorrect.');
    }

    // Verify new password is different from current password
    const isNewPasswordSameAsCurrent = await this.passwordHasher.compare(
      command.newPassword,
      authUser.password!.getValue()
    );
    if (isNewPasswordSameAsCurrent) {
      throw new CannotChangePasswordError('New password must be different from the current password.');
    }

    // Hash the new password
    const newPassword = await this.passwordHasher.hash(command.newPassword);
    authUser.changePassword(Password.fromHash(newPassword));

    // Save the updated user
    await this.uow.withTransaction(async () => {
      await this.authUserRepository.save(authUser);

      await this.audit.logUserAction(
        authUser.id.getValue(),
        AuditAction.PASSWORD_CHANGE,
        AuditTargetType.USER,
        authUser.id.getValue(),
      )
    })
  }
}