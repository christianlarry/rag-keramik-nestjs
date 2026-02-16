import { Role } from "src/generated/prisma/enums";

// ===== Results Interfaces =====
export interface GetRequestedUserByIdResult {
  id: string;
  email: string;
  role: Role;
  fullName: string;
  refreshTokens: string[];
}

// ===== Repository Interface =====
export const AUTH_USER_QUERY_REPOSITORY_TOKEN = 'AUTH_USER_QUERY_REPOSITORY_TOKEN';

export interface AuthUserQueryRepository {
  // User for req.user di validate-access-token.usecase, cukup data yang diperlukan untuk request.user, tidak perlu rehydrate seluruh domain model
  getRequestedUserById(userId: string): Promise<GetRequestedUserByIdResult | null>;
}