import { InvalidRoleError } from "../errors";
import { Role as UserRole } from "../enums/role.enum"

export class Role {
  private readonly value: UserRole;

  private constructor(role: UserRole) {
    this.value = role;
  }

  public static create(role: UserRole): Role {
    if (!Object.values(UserRole).includes(role)) {
      throw new InvalidRoleError(role);
    }

    return new Role(role);
  }

  public static createAdmin(): Role {
    return new Role(UserRole.ADMIN);
  }

  public static createStaff(): Role {
    return new Role(UserRole.STAFF);
  }

  public static createCustomer(): Role {
    return new Role(UserRole.CUSTOMER);
  }

  public getValue(): UserRole {
    return this.value;
  }

  public isAdmin(): boolean {
    return this.value === UserRole.ADMIN;
  }

  public isStaff(): boolean {
    return this.value === UserRole.STAFF;
  }

  public isCustomer(): boolean {
    return this.value === UserRole.CUSTOMER;
  }

  public equals(other: Role): boolean {
    return this.value === other.value;
  }
}