import { UserRole } from "./user.type";

/**
 * Parameters for finding all users with optional filters and pagination.
 */
export interface FindAllUsersParams {
  page?: number;
  limit?: number;
  role?: UserRole;
  search?: string;
  sortBy?: 'createdAt' | 'email' | 'firstName';
  sortOrder?: 'asc' | 'desc';
}