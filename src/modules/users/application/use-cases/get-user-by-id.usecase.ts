import { Inject, Injectable } from "@nestjs/common";
import { USER_QUERY_REPOSITORY_TOKEN, type UserQueryRepository } from "../../domain/repositories/user-query-repository.interface";
import { UserNotFoundError } from "../../domain/errors";

interface GetUserByIdCommand {
  userId: string;
}

interface GetUserByIdResult {
  user: {
    id: string;
    fullName: string;
    email: string;
    gender: string | null;
    dateOfBirth: string | null;
    avatarUrl: string | null;
    phoneNumber: string | null;
    isPhoneVerified: boolean;
    role: string;
    status: string;
    addresses: Array<{
      label: string;
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
export class GetUserByIdUseCase {
  constructor(
    @Inject(USER_QUERY_REPOSITORY_TOKEN)
    private readonly userQueryRepository: UserQueryRepository,
  ) { }

  async execute(command: GetUserByIdCommand): Promise<GetUserByIdResult> {
    const user = await this.userQueryRepository.getUserDetailById(command.userId);

    if (!user) {
      throw new UserNotFoundError(`User with ID ${command.userId} not found.`);
    }

    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString() : null,
        avatarUrl: user.avatarUrl,
        phoneNumber: user.phoneNumber,
        isPhoneVerified: user.phoneVerified,
        role: user.role,
        status: user.status,
        addresses: user.addresses.map((address) => ({
          label: address.label,
          street: address.street,
          city: address.city,
          state: address.province,
          postalCode: address.postalCode,
          country: address.country,
          latitude: address.latitude,
          longitude: address.longitude,
          isDefault: address.isDefault,
        })),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }
}
