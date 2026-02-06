import { InvalidRoleError } from "../errors";

const Roles = {
  ADMIN: 'admin',
  STAFF: 'staff',
  CUSTOMER: 'customer',
} as const;

type RoleType = typeof Roles[keyof typeof Roles];

export class Role {
  private readonly value: RoleType;

  private constructor(role: RoleType) {
    this.value = role;
  }

  public static create(role: RoleType): Role {
    if (!Object.values(Roles).includes(role)) {
      throw new InvalidRoleError(role);
    }

    return new Role(role);
  }

  public static createAdmin(): Role {
    return new Role(Roles.ADMIN);
  }

  public static createStaff(): Role {
    return new Role(Roles.STAFF);
  }

  public static createCustomer(): Role {
    return new Role(Roles.CUSTOMER);
  }

  public getValue(): RoleType {
    return this.value;
  }

  public isAdmin(): boolean {
    return this.value === Roles.ADMIN;
  }

  public isStaff(): boolean {
    return this.value === Roles.STAFF;
  }

  public isCustomer(): boolean {
    return this.value === Roles.CUSTOMER;
  }

  public equals(other: Role): boolean {
    return this.value === other.value;
  }
}