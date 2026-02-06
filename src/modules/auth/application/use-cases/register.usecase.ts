import { Inject, Injectable } from "@nestjs/common";
import { AUTH_USER_REPOSITORY_TOKEN, type AuthUserRepository } from "../../domain/repositories/auth-user-repository.interface";

interface RegisterCommand {
  // Auth Info
  email: string;
  password: string;

  // User Profile Info
  firstName: string;
  lastName: string;
  gender: string;
  phone: string | null;
  dateOfBirth: string | null;
  addresses: Array<{
    street: string;
    city: string;
    province: string;
    postalCode: string;
    country: string | null;
    latitude: number | null;
    longitude: number | null;
    isDefault: boolean | null;
  }>;
}

@Injectable()
export class RegisterUseCase {

  constructor(
    @Inject(AUTH_USER_REPOSITORY_TOKEN) private readonly authUserRepository: AuthUserRepository
  ) { }

  async execute(command: RegisterCommand): Promise<void> {
    const isEmailExist = await this.authUserRepository.isEmailExisting(command.email);

    if (isEmailExist) {
      throw new Error('Email already in use');
    }
  }
}