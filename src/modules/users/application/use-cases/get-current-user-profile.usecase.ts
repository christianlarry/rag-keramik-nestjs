import { Inject, Injectable } from "@nestjs/common";
import { USER_REPOSITORY_TOKEN, type UserRepository } from "../../domain/repositories/user-repository.interface";
import { UserNotFoundError } from "../../domain/errors";
import { Status } from "../../domain/enums/status.enum";
import { Gender } from "../../domain/enums/gender.enum";
import { Role } from "../../domain/enums/role.enum";
import { AddressLabel } from "../../domain/enums/address-label.enum";

interface GetCurrentUserProfileCommand {
  userId: string;
}

interface GetCurrentUserProfileResult {
  user: {
    id: string;
    fullName: string;
    email: string;
    gender: Gender | null;
    dateOfBirth: string | null;
    avatarUrl: string | null;
    phoneNumber: string | null;
    isPhoneVerified: boolean;
    role: Role;
    status: Status;
    addresses: Array<{
      label: AddressLabel;
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
      latitude: number | null;
      longitude: number | null;
      isDefault: boolean;
    }>;
    createdAt: Date;
    updatedAt: Date;
  };
}

@Injectable()
export class GetCurrentUserProfileUseCase {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: UserRepository,
  ) { }

  async execute(command: GetCurrentUserProfileCommand): Promise<GetCurrentUserProfileResult> {
    const user = await this.userRepository.findById(command.userId);

    if (!user) {
      throw new UserNotFoundError(`User with ID ${command.userId} not found.`);
    }

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
        addresses: user.addresses.map((address) => ({
          label: address.getLabel(),
          street: address.getStreet(),
          city: address.getCity(),
          state: address.getProvince(),
          postalCode: address.getPostalCode(),
          country: address.getCountry(),
          latitude: address.getLatitude(),
          longitude: address.getLongitude(),
          isDefault: address.isDefault(),
        })),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }
}
