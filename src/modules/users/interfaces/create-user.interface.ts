import { AddressLabel, AuthProvider, Gender, Role, UserStatus } from "src/generated/prisma/enums";

export interface ICreateUser {
  firstName: string;
  lastName: string;
  password?: string;
  gender: Gender;
  email: string;
  emailVerified?: boolean;
  provider?: AuthProvider;
  providerId?: string;
  role?: Role;
  status?: UserStatus;
  address?: {
    label: AddressLabel;
    recipient: string;
    phone: string;
    street: string;
    city: string;
    province: string;
    postalCode: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    isDefault?: boolean;
  };
}