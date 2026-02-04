export class UserResponseDto {
  id: string;

  email: string;

  emailVerified: boolean;

  emailVerifiedAt?: Date | null;

  firstName?: string | null;

  lastName?: string | null;

  gender?: string | null;

  dateOfBirth?: Date | null;

  phoneNumber?: string | null;

  phoneVerified: boolean;

  phoneVerifiedAt?: Date | null;

  avatarUrl?: string | null;

  role: string;

  status: string;

  provider: string;

  createdAt: Date;

  updatedAt: Date;

  lastLoginAt?: Date | null;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}