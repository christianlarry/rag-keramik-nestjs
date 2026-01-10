enum UserRole {
  ADMIN = 'ADMIN',
  CUSTOMER = 'CUSTOMER',
  STAFF = 'STAFF',
}

export class User {
  id: string;
  email: string;
  emailVerifiedAt?: Date;
  name?: string
  password?: string;
  provider: string;
  providerId?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}