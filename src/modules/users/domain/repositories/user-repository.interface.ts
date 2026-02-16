import { User } from "../entities/user.entity";

/**
 * UserRepository
 * 
 * Repository untuk domain operations yang memerlukan full entity rehydration.
 * Digunakan untuk operasi write (create, update, delete) dan read yang memerlukan business logic.
 * 
 * Pattern: Domain-Driven Design Repository
 * - Semua method return/accept domain entities
 * - Digunakan untuk command operations (write)
 * - Digunakan untuk read operations yang memerlukan business logic
 */
export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<void>;
  delete(id: string): Promise<void>;
}

export const USER_REPOSITORY_TOKEN = 'USER_REPOSITORY';