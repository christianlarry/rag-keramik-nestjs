import { UserGender, UserProvider, UserRole, UserStatus } from "./user.type";

export type CreateUserParams = {
  firstName: string;
  lastName: string;
  password?: string;
  gender: UserGender;
  email: string;
  emailVerified?: boolean;
  provider?: UserProvider;
  providerId?: string;
  role?: UserRole;
  status?: UserStatus;
};