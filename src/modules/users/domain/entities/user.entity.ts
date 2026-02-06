import { Email } from "../value-objects/email.vo";
import { Name } from "../value-objects/name.vo";
import { Role } from "../value-objects/role.vo";
import { Status } from "../value-objects/status.vo";
import { UserId } from "../value-objects/user-id.vo";
import { Gender } from "../value-objects/gender.vo";
import { PhoneNumber } from "../value-objects/phone-number.vo";
import { Address } from "../value-objects/address.vo";
import { UserStateConflictError } from "../errors";
import { Avatar } from "../value-objects/avatar.vo";

interface UserProps {
  // Profile Informations
  name: Name;
  dateOfBirth: Date | null;
  gender: Gender;
  avatarUrl: Avatar | null;

  // Contact Information
  readonly email: Email;
  phoneNumber: PhoneNumber | null;
  phoneVerified: boolean;
  phoneVerifiedAt: Date | null;
  addresses: Address[];

  // Account Status
  readonly role: Role;
  readonly status: Status;

  // Audit Fields
  readonly createdAt: Date;
  updatedAt: Date;
  readonly deletedAt: Date | null;
}

export class User {
  private readonly _id: UserId;
  private props: UserProps;

  constructor(id: UserId, props: UserProps) {
    this._id = id;
    this.props = props;

    this.validate();
  }

  private validate() {
    // Additional validations can be added here if needed, Some are already handled in VOs. Validate Invariants.

    // Ensure that if phone is verified, phone number must be present
    if (this.props.phoneVerified && !this.props.phoneNumber) {
      throw new UserStateConflictError('Phone number must be provided if phone is verified.');
    }

    // Ensure that if phoneVerifiedAt is set, phoneVerified must be true
    if (this.props.phoneVerifiedAt && !this.props.phoneVerified) {
      throw new UserStateConflictError('phoneVerified must be true if phoneVerifiedAt is set.');
    }

    // Ensure that if phone is not verified, phoneVerifiedAt must be null
    if (!this.props.phoneVerifiedAt && this.props.phoneVerified) {
      throw new UserStateConflictError('phoneVerifiedAt must be set if phoneVerified is true.');
    }

    // Ensure that deletedAt is null when status is not 'deleted'
    if (!this.props.status.isDeleted() && this.props.deletedAt) {
      throw new UserStateConflictError('deletedAt must be null when status is not deleted.');
    }

    // Ensure that deletedAt is set when status is 'deleted'
    if (this.props.status.isDeleted() && !this.props.deletedAt) {
      throw new UserStateConflictError('deletedAt must be set when status is deleted.');
    }

    // Ensure that updatedAt is not before createdAt
    if (this.props.updatedAt < this.props.createdAt) {
      throw new UserStateConflictError('updatedAt cannot be before createdAt.');
    }

    // Ensure that dateOfBirth is not in the future
    if (this.props.dateOfBirth && this.props.dateOfBirth > new Date()) {
      throw new UserStateConflictError('dateOfBirth cannot be in the future.');
    }

    // Ensure that dateOfBirth indicates age of at least 0 years
    if (this.props.dateOfBirth) {
      const ageDifMs = Date.now() - this.props.dateOfBirth.getTime();
      const ageDate = new Date(ageDifMs);
      const age = Math.abs(ageDate.getUTCFullYear() - 1970);
      if (age < 0) {
        throw new UserStateConflictError('dateOfBirth indicates invalid age.');
      }
    }

    // Ensure that dateOfBirth is not below 120 years ago
    if (this.props.dateOfBirth) {
      const now = new Date();
      const oldestValidDate = new Date(now.getFullYear() - 120, now.getMonth(), now.getDate());
      if (this.props.dateOfBirth < oldestValidDate) {
        throw new UserStateConflictError('dateOfBirth indicates age greater than 120 years.');
      }
    }
  }

  public static reconstruct(id: string, props: UserProps): User {
    return new User(UserId.fromString(id), props);
  }

  // ===== Getters ===== //
  public get id(): UserId { return this._id; }
  public get name(): Name { return this.props.name; }
  public get dateOfBirth(): Date | null { return this.props.dateOfBirth; }
  public get gender(): Gender { return this.props.gender; }
  public get avatarUrl(): Avatar | null { return this.props.avatarUrl; }
  public get email(): Email { return this.props.email; }
  public get phoneNumber(): PhoneNumber | null { return this.props.phoneNumber; }
  public get phoneVerified(): boolean { return this.props.phoneVerified; }
  public get phoneVerifiedAt(): Date | null { return this.props.phoneVerifiedAt; }
  public get addresses(): Address[] { return this.props.addresses; }
  public get role(): Role { return this.props.role; }
  public get status(): Status { return this.props.status; }
  public get createdAt(): Date { return this.props.createdAt; }
  public get updatedAt(): Date { return this.props.updatedAt; }
  public get deletedAt(): Date | null { return this.props.deletedAt; }
}