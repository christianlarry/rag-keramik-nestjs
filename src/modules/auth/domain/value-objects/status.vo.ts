import { InvalidStatusError } from '../errors';

export class Status {
  private static readonly ACTIVE = 'ACTIVE';
  private static readonly INACTIVE = 'INACTIVE';
  private static readonly SUSPENDED = 'SUSPENDED';
  private static readonly DELETED = 'DELETED';

  private constructor(private readonly value: string) { }

  static createActive(): Status {
    return new Status(this.ACTIVE);
  }

  static createInactive(): Status {
    return new Status(this.INACTIVE);
  }

  static createSuspended(): Status {
    return new Status(this.SUSPENDED);
  }

  static createDeleted(): Status {
    return new Status(this.DELETED);
  }

  static fromString(value: string): Status {
    const upperValue = value.toUpperCase();

    switch (upperValue) {
      case this.ACTIVE:
        return this.createActive();
      case this.INACTIVE:
        return this.createInactive();
      case this.SUSPENDED:
        return this.createSuspended();
      case this.DELETED:
        return this.createDeleted();
      default:
        throw new InvalidStatusError(value);
    }
  }

  getValue(): string {
    return this.value;
  }

  isActive(): boolean {
    return this.value === Status.ACTIVE;
  }

  isInactive(): boolean {
    return this.value === Status.INACTIVE;
  }

  isSuspended(): boolean {
    return this.value === Status.SUSPENDED;
  }

  isDeleted(): boolean {
    return this.value === Status.DELETED;
  }

  canLogin(): boolean {
    return this.isActive();
  }

  canPlaceOrder(): boolean {
    return this.isActive();
  }

  canUpdateProfile(): boolean {
    return this.isActive() || this.isInactive();
  }

  requiresTokenClearing(): boolean {
    return this.isSuspended() || this.isDeleted() || this.isInactive();
  }

  isRestricted(): boolean {
    return !this.isActive();
  }

  getDisplayName(): string {
    switch (this.value) {
      case Status.ACTIVE:
        return 'Active';
      case Status.INACTIVE:
        return 'Inactive';
      case Status.SUSPENDED:
        return 'Suspended';
      case Status.DELETED:
        return 'Deleted';
      default:
        return this.value;
    }
  }

  getColorCode(): string {
    switch (this.value) {
      case Status.ACTIVE:
        return 'green';
      case Status.INACTIVE:
        return 'gray';
      case Status.SUSPENDED:
        return 'red';
      case Status.DELETED:
        return 'black';
      default:
        return 'gray';
    }
  }

  equals(other: Status): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}