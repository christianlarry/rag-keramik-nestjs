import { AddressLabel } from "../enums/address-label.enum";
import { Gender } from "../enums/gender.enum";
import { Role } from "../enums/role.enum";
import { Status } from "../enums/status.enum";

// ===== Query Options =====
export interface FindAllUsersQueryOptions {
  page?: number;
  limit?: number;
  role?: string;
  status?: string;
}

// ===== Query Results =====
export interface UserListItemResult {
  id: string;
  fullName: string;
  email: string;
  gender: Gender | null;
  dateOfBirth: Date | null;
  avatarUrl: string | null;
  phoneNumber: string | null;
  phoneVerified: boolean;
  role: Role;
  status: Status;
  createdAt: Date;
  updatedAt: Date;
}

export interface FindAllUsersQueryResult {
  users: UserListItemResult[];
  total: number;
}

export interface UserDetailResult {
  id: string;
  fullName: string;
  email: string;
  gender: Gender | null;
  dateOfBirth: Date | null;
  avatarUrl: string | null;
  phoneNumber: string | null;
  phoneVerified: boolean;
  role: Role;
  status: Status;
  addresses: Array<{
    label: AddressLabel;
    recipient: string;
    phone: string;
    street: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
    latitude: number | null;
    longitude: number | null;
    isDefault: boolean;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

// ===== Repository Interface =====
export const USER_QUERY_REPOSITORY_TOKEN = 'USER_QUERY_REPOSITORY';

/**
 * UserQueryRepository
 * 
 * Repository khusus untuk query/read operations yang tidak memerlukan domain entity rehydration.
 * Digunakan untuk operasi list, search, dan reporting yang lebih ringan.
 * 
 * Pattern: CQRS (Command Query Responsibility Segregation)
 * - Command Repository (UserRepository): Write operations, domain entity focus
 * - Query Repository (UserQueryRepository): Read operations, DTO/plain object focus
 */
export interface UserQueryRepository {
  /**
   * Get paginated list of users for admin dashboard
   * Returns plain objects without domain entity rehydration for better performance
   */
  findAllUsers(options?: FindAllUsersQueryOptions): Promise<FindAllUsersQueryResult>;

  /**
   * Get user detail by ID for admin view
   * Returns plain object with all user data including addresses
   */
  getUserDetailById(userId: string): Promise<UserDetailResult | null>;
}
