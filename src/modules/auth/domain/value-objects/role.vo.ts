import { InvalidRoleError } from "../exceptions";

export const RoleValues = {
  ADMIN: 'ADMIN',
  STAFF: 'STAFF',
  CUSTOMER: 'CUSTOMER',
} as const

export type RoleType = typeof RoleValues[keyof typeof RoleValues];

export class Role {
  private constructor(private readonly value: RoleType) {
    if (!value || value.trim().length === 0) {
      throw new InvalidRoleError(value);
    }
    Object.freeze(this);
  }

  static createAdmin(): Role {
    return new Role(RoleValues.ADMIN);
  }

  static createStaff(): Role {
    return new Role(RoleValues.STAFF);
  }

  static createCustomer(): Role {
    return new Role(RoleValues.CUSTOMER);
  }

  static fromString(value: string): Role {
    const upperValue = value.toUpperCase();

    switch (upperValue) {
      case RoleValues.ADMIN:
        return this.createAdmin();
      case RoleValues.STAFF:
        return this.createStaff();
      case RoleValues.CUSTOMER:
        return this.createCustomer();
      default:
        throw new InvalidRoleError(upperValue);
    }
  }

  getValue(): RoleType {
    return this.value;
  }

  // Hierarchy & Permissions
  private getHierarchy(): number {
    switch (this.value) {
      case RoleValues.ADMIN:
        return 3;
      case RoleValues.STAFF:
        return 2;
      case RoleValues.CUSTOMER:
        return 1;
      default:
        return 0;
    }
  }

  hasPermission(requiredRole: Role): boolean {
    return this.getHierarchy() >= requiredRole.getHierarchy();
  }

  isAdmin(): boolean {
    return this.value === RoleValues.ADMIN;
  }

  isStaff(): boolean {
    return this.value === RoleValues.STAFF;
  }

  isCustomer(): boolean {
    return this.value === RoleValues.CUSTOMER;
  }

  canAccessAdminPanel(): boolean {
    return this.isAdmin() || this.isStaff();
  }

  canManageProducts(): boolean {
    return this.isAdmin() || this.isStaff();
  }

  canManageOrders(): boolean {
    return this.isAdmin() || this.isStaff();
  }

  canManageUsers(): boolean {
    return this.isAdmin();
  }

  getDisplayName(): string {
    switch (this.value) {
      case RoleValues.ADMIN:
        return 'Administrator';
      case RoleValues.STAFF:
        return 'Staff';
      case RoleValues.CUSTOMER:
        return 'Customer';
      default:
        return this.value;
    }
  }

  equals(other: Role): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}