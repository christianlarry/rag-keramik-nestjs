import { InvalidRoleError } from "../errors";
import { Role as UserRole } from "../enums/role.enum"

export class Role {
  private readonly value: UserRole;

  private constructor(role: UserRole) {
    this.value = role;

    this.validate();
  }

  private validate(): void {
    if (!Object.values(UserRole).includes(this.value)) {
      throw new InvalidRoleError(this.value);
    }
  }

  public static create(role: string): Role {
    return new Role(role as UserRole);
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