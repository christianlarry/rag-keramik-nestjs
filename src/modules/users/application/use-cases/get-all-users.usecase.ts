import { Inject, Injectable } from "@nestjs/common";
import { USER_QUERY_REPOSITORY_TOKEN, type UserQueryRepository } from "../../domain/repositories/user-query-repository.interface";

interface GetAllUsersCommand {
  page?: number;
  limit?: number;
  role?: string;
  status?: string;
}

interface GetAllUsersResult {
  users: Array<{
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
    createdAt: Date;
    updatedAt: Date;
  }>;
  pagination: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

@Injectable()
export class GetAllUsersUseCase {
  constructor(
    @Inject(USER_QUERY_REPOSITORY_TOKEN)
    private readonly userQueryRepository: UserQueryRepository,
  ) { }

  async execute(command: GetAllUsersCommand): Promise<GetAllUsersResult> {
    const page = command.page || 1;
    const limit = command.limit || 10;

    const { users, total } = await this.userQueryRepository.findAllUsers({
      page,
      limit,
      role: command.role,
      status: command.status,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      users: users.map((user) => ({
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
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })),
      pagination: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems: total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }
}
