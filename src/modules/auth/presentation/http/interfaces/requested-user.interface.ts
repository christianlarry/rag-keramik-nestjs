import { Role } from "src/modules/users/domain/enums/role.enum";

export interface RequestedUser {
  id: string;
  email: string;
  role: Role;
  name?: string;
  provider?: string;
  refreshToken?: string;
}