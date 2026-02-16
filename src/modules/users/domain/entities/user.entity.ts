import { Email } from "../value-objects/email.vo";
import { Name } from "../value-objects/name.vo";
import { Role } from "../value-objects/role.vo";
import { Status } from "../value-objects/status.vo";
import { UserId } from "../value-objects/user-id.vo";
import { Gender } from "../value-objects/gender.vo";
import { PhoneNumber } from "../value-objects/phone-number.vo";
import { Address } from "../value-objects/address.vo";
import { UserStateConflictError, UserInvalidOperationError, UserCannotTransitionStateError, UserAddressNotFoundError } from "../errors";
import { Avatar } from "../value-objects/avatar.vo";
import { DateOfBirth } from "../value-objects/date-of-birth.vo";
import { AggregateRoot } from "src/core/domain/aggregate-root.base";
import { UserProfileUpdatedEvent } from "../events/user-profile-updated.event";
import { PhoneNumberUpdatedEvent } from "../events/phone-number-updated.event";
import { PhoneNumberVerifiedEvent } from "../events/phone-number-verified.event";
import { PhoneNumberUnverifiedEvent } from "../events/phone-number-unverified.event";
import { AddressAddedEvent } from "../events/address-added.event";
import { AddressUpdatedEvent } from "../events/address-updated.event";
import { AddressRemovedEvent } from "../events/address-removed.event";
import { UserActivatedEvent } from "../events/user-activated.event";
import { UserDeactivatedEvent } from "../events/user-deactivated.event";
import { UserSuspendedEvent } from "../events/user-suspended.event";
import { UserUnsuspendedEvent } from "../events/user-unsuspended.event";
import { UserDeletedEvent } from "../events/user-deleted.event";
import { UserRestoredEvent } from "../events/user-restored.event";
import { UserUpdatedEvent } from "../events/user-updated.event";

interface UserProps {
  // Profile Informations
  name: Name;
  dateOfBirth: DateOfBirth | null;
  gender: Gender | null;
  avatarUrl: Avatar | null;

  // Contact Information
  phoneNumber: PhoneNumber | null;
  phoneVerified: boolean;
  phoneVerifiedAt: Date | null;
  addresses: Address[];

  // Auth Readonly Fields
  readonly email: Email;
  readonly role: Role;
  status: Status;

  // Audit Fields
  readonly createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class User extends AggregateRoot {
  private readonly _id: UserId;
  private props: UserProps;

  constructor(id: UserId, props: UserProps) {
    super();

    this._id = id;
    this.props = props;

    this.validate();
  }

  private validate() {
    // Validate address default constraint
    const defaultAddresses = this.props.addresses.filter(addr => addr.isDefault());
    if (defaultAddresses.length > 1) {
      throw new UserStateConflictError('User cannot have more than one default address.');
    }

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
  }

  public static reconstruct(id: string, props: UserProps): User {
    return new User(UserId.fromString(id), props);
  }

  // ==================== QUERY METHODS ==================== //

  // === Status Queries === //

  /**
   * Check if user is active
   */
  public isActive(): boolean {
    return this.props.status.isActive();
  }

  /**
   * Check if user is inactive
   */
  public isInactive(): boolean {
    return this.props.status.isInactive();
  }

  /**
   * Check if user is suspended
   */
  public isSuspended(): boolean {
    return this.props.status.isSuspended();
  }

  /**
   * Check if user is soft deleted
   */
  public isDeleted(): boolean {
    return this.props.status.isDeleted();
  }

  // === Phone Queries === //

  /**
   * Check if user's phone is verified
   */
  public isPhoneVerified(): boolean {
    return this.props.phoneVerified;
  }

  /**
   * Check if user has a phone number set
   */
  public hasPhoneNumber(): boolean {
    return this.props.phoneNumber !== null;
  }

  // === Address Queries === //

  /**
   * Check if user has any addresses
   */
  public hasAddress(): boolean {
    return this.props.addresses.length > 0;
  }

  /**
   * Check if user has a specific number of addresses
   */
  public hasAddressCount(count: number): boolean {
    return this.props.addresses.length === count;
  }

  // === Capability Queries === //

  /**
   * Check if user can be activated
   */
  public canBeActivated(): boolean {
    return this.props.status.isInactive();
  }

  /**
   * Check if user can be deactivated
   */
  public canBeDeactivated(): boolean {
    return this.props.status.isActive();
  }

  /**
   * Check if user can be suspended
   */
  public canBeSuspended(): boolean {
    return this.props.status.isActive() || this.props.status.isInactive();
  }

  /**
   * Check if user can be deleted
   */
  public canBeDeleted(): boolean {
    return !this.props.status.isDeleted();
  }

  /**
   * Check if user can be restored
   */
  public canBeRestored(): boolean {
    return this.props.status.isDeleted();
  }

  /**
   * Check if user can be modified (profile updates, etc.)
   * Deleted and suspended users cannot be modified
   */
  public canBeModified(): boolean {
    return !this.props.status.isDeleted() && !this.props.status.isSuspended();
  }

  // === Ensure Invariants Methods === //

  /**
   * Ensure user is not deleted
   * @throws {UserInvalidOperationError} if user is deleted
   */
  public ensureNotDeleted(): void {
    if (this.props.status.isDeleted()) {
      throw new UserInvalidOperationError('Operation cannot be performed on a deleted user.');
    }
  }

  /**
   * Ensure user is active
   * @throws {UserInvalidOperationError} if user is not active
   */
  public ensureActive(): void {
    if (!this.props.status.isActive()) {
      throw new UserInvalidOperationError('Operation requires the user to be active.');
    }
  }

  /**
   * Ensure user is not suspended
   * @throws {UserInvalidOperationError} if user is suspended
   */
  public ensureNotSuspended(): void {
    if (this.props.status.isSuspended()) {
      throw new UserInvalidOperationError('Operation cannot be performed on a suspended user.');
    }
  }

  /**
   * Ensure user can be modified (not deleted and not suspended)
   * @throws {UserInvalidOperationError} if user cannot be modified
   */
  public ensureCanBeModified(): void {
    if (this.props.status.isDeleted()) {
      throw new UserInvalidOperationError('Cannot modify a deleted user.');
    }

    if (this.props.status.isSuspended()) {
      throw new UserInvalidOperationError('Cannot modify a suspended user.');
    }
  }

  // ==================== COMMAND METHODS ==================== //

  // === Profile Commands === //

  /**
   * Update user profile information
   * @throws {UserInvalidOperationError} if user is deleted or suspended
   */
  public updateProfile(params: {
    name?: Name;
    dateOfBirth?: DateOfBirth | null;
    gender?: Gender | null;
    avatarUrl?: Avatar | null;
  }): void {
    this.ensureCanBeModified();
    let fieldUpdatedCount = 0;

    if (params.name !== undefined && !this.props.name.equals(params.name)) {
      this.props.name = params.name;
      fieldUpdatedCount++;
    }

    if (params.dateOfBirth !== undefined) {
      if (!(this.props.dateOfBirth && params.dateOfBirth && this.props.dateOfBirth.equals(params.dateOfBirth))) {
        this.props.dateOfBirth = params.dateOfBirth;
        fieldUpdatedCount++;
      }
    }

    if (params.gender !== undefined) {
      if (!(this.props.gender && params.gender && this.props.gender.equals(params.gender))) {
        this.props.gender = params.gender;
        fieldUpdatedCount++;
      }
    }

    if (params.avatarUrl !== undefined) {
      if (!(this.props.avatarUrl && params.avatarUrl && this.props.avatarUrl.equals(params.avatarUrl))) {
        this.props.avatarUrl = params.avatarUrl;
        fieldUpdatedCount++;
      }
    }

    if (fieldUpdatedCount === 0) return // No fields updated, so skip event

    this.applyChange();

    this.addDomainEvent(new UserProfileUpdatedEvent({
      userId: this.id.getValue(),
      profile: {
        name: params.name,
        dateOfBirth: params.dateOfBirth,
        gender: params.gender,
        avatarUrl: params.avatarUrl,
      }
    }))
  }

  // === Phone Commands === //

  /**
   * Update user phone number
   * When phone number is changed, phone verification status is reset
   * @throws {UserInvalidOperationError} if user is deleted or suspended
   */
  public updatePhoneNumber(phoneNumber: PhoneNumber | null): void {
    this.ensureCanBeModified();

    const wasVerified = this.props.phoneVerified;
    this.props.phoneNumber = phoneNumber;

    // Reset phone verification when phone number changes
    if (phoneNumber === null) {
      this.props.phoneVerified = false;
      this.props.phoneVerifiedAt = null;
    } else if (this.props.phoneNumber && !this.props.phoneNumber.equals(phoneNumber)) {
      this.props.phoneVerified = false;
      this.props.phoneVerifiedAt = null;
    }

    this.applyChange();

    this.addDomainEvent(new PhoneNumberUpdatedEvent({
      userId: this.id.getValue(),
      phoneNumber: phoneNumber ? phoneNumber.getValue() : null,
      wasVerified
    }))
  }

  /**
   * Clear user's phone number and reset verification status
   * @throws {UserInvalidOperationError} if user is deleted or suspended
   */
  public clearPhoneNumber(): void {
    this.updatePhoneNumber(null);
  }

  /**
   * Mark phone number as verified
   * @throws {UserInvalidOperationError} if user is deleted or suspended
   * @throws {UserStateConflictError} if phone number is not set or already verified
   */
  public verifyPhone(): void {
    this.ensureCanBeModified();

    if (!this.props.phoneNumber) {
      throw new UserStateConflictError('Cannot verify phone: phone number is not set.');
    }

    if (this.props.phoneVerified) {
      throw new UserStateConflictError('Phone number is already verified.');
    }

    this.props.phoneVerified = true;
    this.props.phoneVerifiedAt = new Date();
    this.applyChange();

    this.addDomainEvent(new PhoneNumberVerifiedEvent({
      userId: this.id.getValue(),
      phoneNumber: this.props.phoneNumber.getValue(),
      verifiedAt: this.props.phoneVerifiedAt
    }))
  }

  /**
   * Mark phone number as unverified
   * @throws {UserInvalidOperationError} if user is deleted or suspended
   */
  public unverifyPhone(): void {
    this.ensureCanBeModified();

    this.props.phoneVerified = false;
    this.props.phoneVerifiedAt = null;
    this.applyChange();

    this.addDomainEvent(new PhoneNumberUnverifiedEvent({
      userId: this.id.getValue()
    }))
  }

  // === Address Commands === //

  /**
   * Add a new address to user's address list
   * @throws {UserInvalidOperationError} if user is deleted or suspended
   */
  public addAddress(address: Address): void {
    this.ensureCanBeModified();

    this.props.addresses.push(address);
    this.applyChange();

    this.addDomainEvent(new AddressAddedEvent({
      userId: this.id.getValue(),
      addressIndex: this.props.addresses.length - 1
    }))
  }

  /**
   * Update an existing address
   * @throws {UserInvalidOperationError} if user is deleted or suspended
   * @throws {UserAddressNotFoundError} if address not found at the specified index
   */
  public updateAddress(index: number, address: Address): void {
    this.ensureCanBeModified();

    if (index < 0 || index >= this.props.addresses.length) {
      throw new UserAddressNotFoundError(`Address at index ${index} not found.`);
    }

    this.props.addresses[index] = address;
    this.applyChange();

    this.addDomainEvent(new AddressUpdatedEvent({
      userId: this.id.getValue(),
      addressIndex: index
    }))
  }

  /**
   * Remove an address from user's address list
   * @throws {UserInvalidOperationError} if user is deleted or suspended
   * @throws {UserAddressNotFoundError} if address not found at the specified index
   */
  public removeAddress(index: number): void {
    this.ensureCanBeModified();

    if (index < 0 || index >= this.props.addresses.length) {
      throw new UserAddressNotFoundError(`Address at index ${index} not found.`);
    }

    this.props.addresses.splice(index, 1);
    this.applyChange();

    this.addDomainEvent(new AddressRemovedEvent({
      userId: this.id.getValue(),
      addressIndex: index
    }))
  }

  // === State Transition Commands === //

  /**
   * Activate the user
   * Only inactive users can be activated
   * @throws {UserCannotTransitionStateError} if user cannot be activated
   */
  public activate(): void {
    if (this.props.status.isActive()) {
      throw new UserCannotTransitionStateError('User is already active.');
    }

    if (this.props.status.isDeleted()) {
      throw new UserCannotTransitionStateError('Cannot activate a deleted user. Use restore() instead.');
    }

    if (this.props.status.isSuspended()) {
      throw new UserCannotTransitionStateError('Cannot activate a suspended user directly. Unsuspend first or use restore().');
    }

    this.props.status = Status.createActive();
    this.applyChange();

    this.addDomainEvent(new UserActivatedEvent({
      userId: this.id.getValue(),
      activatedAt: this.props.updatedAt
    }))
  }

  /**
   * Deactivate the user
   * Only active users can be deactivated
   * @throws {UserCannotTransitionStateError} if user cannot be deactivated
   */
  public deactivate(): void {
    if (this.props.status.isInactive()) {
      throw new UserCannotTransitionStateError('User is already inactive.');
    }

    if (this.props.status.isDeleted()) {
      throw new UserCannotTransitionStateError('Cannot deactivate a deleted user.');
    }

    if (this.props.status.isSuspended()) {
      throw new UserCannotTransitionStateError('Cannot deactivate a suspended user. Unsuspend first.');
    }

    this.props.status = Status.createInactive();
    this.applyChange();

    this.addDomainEvent(new UserDeactivatedEvent({
      userId: this.id.getValue(),
      deactivatedAt: this.props.updatedAt
    }))
  }

  /**
   * Suspend the user
   * Active or inactive users can be suspended
   * @throws {UserCannotTransitionStateError} if user cannot be suspended
   */
  public suspend(): void {
    if (this.props.status.isSuspended()) {
      throw new UserCannotTransitionStateError('User is already suspended.');
    }

    if (this.props.status.isDeleted()) {
      throw new UserCannotTransitionStateError('Cannot suspend a deleted user.');
    }

    this.props.status = Status.createSuspended();
    this.applyChange();

    this.addDomainEvent(new UserSuspendedEvent({
      userId: this.id.getValue(),
      suspendedAt: this.props.updatedAt
    }))
  }

  /**
   * Unsuspend the user (return to active state)
   * Only suspended users can be unsuspended
   * @throws {UserCannotTransitionStateError} if user is not suspended
   */
  public unsuspend(): void {
    if (!this.props.status.isSuspended()) {
      throw new UserCannotTransitionStateError('Cannot unsuspend a user that is not suspended.');
    }

    this.props.status = Status.createActive();
    this.applyChange();

    this.addDomainEvent(new UserUnsuspendedEvent({
      userId: this.id.getValue(),
      unsuspendedAt: this.props.updatedAt
    }))
  }

  /**
   * Soft delete the user
   * Users in any state except deleted can be soft deleted
   * @throws {UserCannotTransitionStateError} if user is already deleted
   */
  public delete(): void {
    if (this.props.status.isDeleted()) {
      throw new UserCannotTransitionStateError('User is already deleted.');
    }

    this.props.status = Status.createDeleted();
    this.props.deletedAt = new Date();

    this.applyChange();

    this.addDomainEvent(new UserDeletedEvent({
      userId: this.id.getValue(),
      deletedAt: this.props.deletedAt
    }))
  }

  /**
   * Restore a soft-deleted user
   * Only deleted users can be restored (returns to inactive state)
   * @throws {UserCannotTransitionStateError} if user is not deleted
   */
  public restore(): void {
    if (!this.props.status.isDeleted()) {
      throw new UserCannotTransitionStateError('Cannot restore a user that is not deleted.');
    }

    this.props.status = Status.createInactive();
    this.props.deletedAt = null;

    this.applyChange();

    this.addDomainEvent(new UserRestoredEvent({
      userId: this.id.getValue(),
      restoredAt: this.props.updatedAt
    }))
  }

  private applyChange(): void {
    this.props.updatedAt = new Date();

    this.addDomainEvent(new UserUpdatedEvent({
      userId: this.id.getValue(),
      email: this.props.email.getValue(),
      phoneNumber: this.props.phoneNumber ? this.props.phoneNumber.getValue() : undefined,
      updatedAt: this.props.updatedAt
    }))
  }

  // ===== DEPRECATED: Check Methods (retained for compatibility) ===== //

  /**
   * @deprecated Use isActive() from Query Methods section instead
   */
  public get isActiveUser(): boolean {
    return this.isActive();
  }

  // ===== Getters ===== //
  public get id(): UserId { return this._id; }
  public get name(): Name { return this.props.name; }
  public get dateOfBirth(): DateOfBirth | null { return this.props.dateOfBirth; }
  public get gender(): Gender | null { return this.props.gender; }
  public get avatarUrl(): Avatar | null { return this.props.avatarUrl; }
  public get email(): Email { return this.props.email; }
  public get phoneNumber(): PhoneNumber | null { return this.props.phoneNumber; }
  public get phoneVerified(): boolean { return this.props.phoneVerified; }
  public get phoneVerifiedAt(): Date | null { return this.props.phoneVerifiedAt; }
  public get addresses(): Address[] { return this.props.addresses; }
  public get defaultAddress(): Address | null { return this.props.addresses.find(addr => addr.isDefault()) ?? null; }
  public get role(): Role { return this.props.role; }
  public get status(): Status { return this.props.status; }
  public get createdAt(): Date { return this.props.createdAt; }
  public get updatedAt(): Date { return this.props.updatedAt; }
  public get deletedAt(): Date | null { return this.props.deletedAt; }
  public get profile(): { name: Name; dateOfBirth: DateOfBirth | null; gender: Gender | null; avatarUrl: Avatar | null } {
    return {
      name: this.props.name,
      dateOfBirth: this.props.dateOfBirth,
      gender: this.props.gender,
      avatarUrl: this.props.avatarUrl,
    };
  }
} 