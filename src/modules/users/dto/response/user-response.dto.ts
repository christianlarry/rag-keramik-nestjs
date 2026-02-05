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

  constructor(data: UserResponseDto) {
    this.id = data.id;
    this.email = data.email;
    this.emailVerified = data.emailVerified;
    this.emailVerifiedAt = data.emailVerifiedAt;
    this.firstName = data.firstName;
    this.lastName = data.lastName;
    this.gender = data.gender;
    this.dateOfBirth = data.dateOfBirth;
    this.phoneNumber = data.phoneNumber;
    this.phoneVerified = data.phoneVerified;
    this.phoneVerifiedAt = data.phoneVerifiedAt;
    this.avatarUrl = data.avatarUrl;
    this.role = data.role;
    this.status = data.status;
    this.provider = data.provider;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.lastLoginAt = data.lastLoginAt;
  }
}