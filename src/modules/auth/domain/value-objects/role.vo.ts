import { InvalidRoleError } from "../exceptions";

export class Role {
  private static readonly ADMIN = 'ADMIN';
  private static readonly STAFF = 'STAFF';
  private static readonly CUSTOMER = 'CUSTOMER';

  private constructor(private readonly value: string) { }

  static createAdmin(): Role {
    return new Role(this.ADMIN);
  }

  static createStaff(): Role {
    return new Role(this.STAFF);
  }

  static createCustomer(): Role {
    return new Role(this.CUSTOMER);
  }

  static fromString(value: string): Role {
    const upperValue = value.toUpperCase();

    switch (upperValue) {
      case this.ADMIN:
        return this.createAdmin();
      case this.STAFF:
        return this.createStaff();
      case this.CUSTOMER:
        return this.createCustomer();
      default:
        throw new InvalidRoleError(upperValue);
    }
  }

  getValue(): string {
    return this.value;
  }

  // Hierarchy & Permissions
  private getHierarchy(): number {
    switch (this.value) {
      case Role.ADMIN:
        return 3;
      case Role.STAFF:
        return 2;
      case Role.CUSTOMER:
        return 1;
      default:
        return 0;
    }
  }

  hasPermission(requiredRole: Role): boolean {
    return this.getHierarchy() >= requiredRole.getHierarchy();
  }

  isAdmin(): boolean {
    return this.value === Role.ADMIN;
  }

  isStaff(): boolean {
    return this.value === Role.STAFF;
  }

  isCustomer(): boolean {
    return this.value === Role.CUSTOMER;
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
      case Role.ADMIN:
        return 'Administrator';
      case Role.STAFF:
        return 'Staff';
      case Role.CUSTOMER:
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