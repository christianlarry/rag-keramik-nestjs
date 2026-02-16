import { Inject, Injectable, Logger } from "@nestjs/common";
import { USER_REPOSITORY_TOKEN, type UserRepository } from "../../domain/repositories/user-repository.interface";
import { UserNotFoundError } from "../../domain/errors";
import { Name } from "../../domain/value-objects/name.vo";
import { Gender } from "../../domain/value-objects/gender.vo";
import { Gender as GenderEnum } from "../../domain/enums/gender.enum";
import { DateOfBirth } from "../../domain/value-objects/date-of-birth.vo";
import { Avatar } from "../../domain/value-objects/avatar.vo";
import { PhoneNumber } from "../../domain/value-objects/phone-number.vo";
import { Role } from "../../domain/enums/role.enum";
import { Status } from "../../domain/enums/status.enum";

interface UpdateCurrentUserProfileCommand {
  userId: string;
  fullName?: string;
  gender?: GenderEnum;
  dateOfBirth?: string;
  avatarUrl?: string;
  phoneNumber?: string;
}

interface UpdateCurrentUserProfileResult {
  user: {
    id: string;
    fullName: string;
    email: string;
    gender: GenderEnum | null;
    dateOfBirth: string | null;
    avatarUrl: string | null;
    phoneNumber: string | null;
    isPhoneVerified: boolean;
    role: Role;
    status: Status;
    updatedAt: Date;
  };
}

@Injectable()
export class UpdateCurrentUserProfileUseCase {
  private readonly logger = new Logger(UpdateCurrentUserProfileUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: UserRepository,
  ) { }

  async execute(command: UpdateCurrentUserProfileCommand): Promise<UpdateCurrentUserProfileResult> {
    // 1. Find user
    const user = await this.userRepository.findById(command.userId);

    if (!user) {
      throw new UserNotFoundError(`User with ID ${command.userId} not found.`);
    }

    // 2. Update profile fields
    const updateData: {
      name?: Name;
      gender?: Gender | null;
      dateOfBirth?: DateOfBirth | null;
      avatarUrl?: Avatar | null;
    } = {};

    if (command.fullName !== undefined) updateData.name = Name.create(command.fullName);
    if (command.gender !== undefined) updateData.gender = command.gender ? Gender.create(command.gender) : null;
    if (command.dateOfBirth !== undefined) updateData.dateOfBirth = command.dateOfBirth ? DateOfBirth.fromString(command.dateOfBirth) : null;
    if (command.avatarUrl !== undefined) updateData.avatarUrl = command.avatarUrl ? Avatar.create(command.avatarUrl) : null;

    if (Object.keys(updateData).length > 0) {
      user.updateProfile(updateData);
    }

    if (command.phoneNumber !== undefined) {
      const phoneNumber = command.phoneNumber ? PhoneNumber.create(command.phoneNumber) : null;
      user.updatePhoneNumber(phoneNumber);
    }

    // 3. Save user
    await this.userRepository.save(user);

    this.logger.log(`User profile updated for user ID: ${command.userId}`);

    // 4. Return result
    return {
      user: {
        id: user.id.getValue(),
        fullName: user.name.getFullName(),
        email: user.email.getValue(),
        gender: user.gender?.getValue() || null,
        dateOfBirth: user.dateOfBirth?.toString() || null,
        avatarUrl: user.avatarUrl?.getValue() || null,
        phoneNumber: user.phoneNumber?.getValue() || null,
        isPhoneVerified: user.phoneVerified,
        role: user.role.getValue(),
        status: user.status.getValue(),
        updatedAt: user.updatedAt,
      },
    };
  }
}
