import { Exclude } from 'class-transformer';

export class UserEntity {
  id: string; // Unique identifier UUID
  email: string;
  emailVerified: boolean;

  @Exclude()
  password?: string; // Hashed password

  firstName?: string;
  lastName?: string;
  gender?: UserGender;
  dateOfBirth?: Date;
  phoneNumber?: string;
  phoneVerified?: boolean;
  avatarUrl?: string; // URL to avatar image

  role: UserRole;
  status: UserStatus;

  @Exclude() // Token should not be exposed
  refreshTokens?: string[]; // For JWT refresh token

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

  /**
   * Converts the user entity to a JSON object, excluding sensitive fields.
   * @returns A JSON representation of the user entity without sensitive data.
   */
  toJSON() {
    const user: Omit<UserEntity, 'password' | 'refreshToken'> = { ...this };

    return user;
  }
}

export const UserRole = {
  ADMIN: 'admin',
  USER: 'user',
  MODERATOR: 'moderator',
} as const;
export type UserRole = typeof UserRole[keyof typeof UserRole];

export const UserStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  PENDING: 'pending',
} as const;
export type UserStatus = typeof UserStatus[keyof typeof UserStatus];

export const UserGender = {
  MALE: 'male',
  FEMALE: 'female'
} as const;
export type UserGender = typeof UserGender[keyof typeof UserGender];