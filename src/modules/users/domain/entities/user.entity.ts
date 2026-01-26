import { Exclude } from 'class-transformer';
import { UserGender, UserProvider, UserRole, UserStatus } from '../types/user.type';

export class UserEntity {
  id: string; // Unique identifier UUID
  email: string;
  emailVerified: boolean;

  @Exclude()
  password?: string; // Hashed password

  firstName?: string;
  lastName?: string;
  gender: UserGender;
  dateOfBirth?: Date;
  phoneNumber?: string;
  phoneVerified: boolean;
  avatarUrl?: string; // URL to avatar image

  role: UserRole;
  status: UserStatus;
  provider: UserProvider; // OAuth provider name

  @Exclude() // Token should not be exposed
  refreshTokens: string[]; // For JWT refresh token

  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date; // Timestamp of last login

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }

  get fullName(): string {
    return `${this.firstName || ''} ${this.lastName || ''}`.trim();
  }

  get isActive(): boolean {
    return this.status === 'active';
  }

  get isAdult(): boolean {
    const adultAge = 18;

    if (!this.dateOfBirth) return false;
    const ageDifMs = Date.now() - this.dateOfBirth.getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970) >= adultAge;
  }
}